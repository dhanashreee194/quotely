import { asc, desc, eq, like, or, sql } from 'drizzle-orm'
import { calculateQuotationTotals } from '../../shared/calc'
import { isReservedQuotationFieldKey } from '../../shared/metadata'
import type { QuotationStatus } from '../../shared/quotation'
import type {
  QuotationBundle,
  QuotationChargeInput,
  QuotationCustomValueInput,
  QuotationInput,
  QuotationItemInput,
  QuotationListItem
} from '../../shared/types'
import { getDatabase } from '../db'
import {
  customFieldDefinitions,
  customers,
  quotationCharges,
  quotationCustomValues,
  quotationItems,
  quotationTemplates,
  quotations
} from '../db/schema'
import { allocateQuotationNumber } from './numbering'

function now(): string {
  return new Date().toISOString()
}

function emptyToNull(value?: string | null): string | null {
  if (value == null) return null
  const trimmed = value.trim()
  return trimmed.length === 0 ? null : trimmed
}

function parseColumnValues(raw: string | null | undefined): Record<string, unknown> {
  if (!raw) return {}
  try {
    const parsed = JSON.parse(raw) as unknown
    return parsed && typeof parsed === 'object' ? (parsed as Record<string, unknown>) : {}
  } catch {
    return {}
  }
}

function assertCustomValues(values: QuotationCustomValueInput[]): void {
  const db = getDatabase()
  for (const value of values) {
    const definition = db
      .select()
      .from(customFieldDefinitions)
      .where(eq(customFieldDefinitions.id, value.fieldDefinitionId))
      .get()
    if (!definition) {
      throw new Error(`Unknown custom field definition: ${value.fieldDefinitionId}`)
    }
    if (isReservedQuotationFieldKey(definition.fieldKey)) {
      throw new Error(
        `Cannot store reserved field "${definition.fieldKey}" as a custom value`
      )
    }
  }
}

function computeTotals(items: QuotationItemInput[], charges: QuotationChargeInput[], discountTotal = 0) {
  return calculateQuotationTotals(
    items.map((item) => ({
      qty: item.qty,
      rate: item.rate,
      discount: item.discount ?? 0,
      discountType: item.discountType ?? 'fixed'
    })),
    charges.map((charge) => ({
      type: charge.type,
      value: charge.value,
      appliesToSubtotal: charge.appliesToSubtotal ?? true
    })),
    discountTotal
  )
}

function loadBundle(id: number): QuotationBundle | null {
  const db = getDatabase()
  const row = db
    .select({
      quotation: quotations,
      customerName: customers.name,
      templateName: quotationTemplates.name
    })
    .from(quotations)
    .leftJoin(customers, eq(quotations.customerId, customers.id))
    .leftJoin(quotationTemplates, eq(quotations.templateId, quotationTemplates.id))
    .where(eq(quotations.id, id))
    .get()

  if (!row) return null

  const customValues = db
    .select()
    .from(quotationCustomValues)
    .where(eq(quotationCustomValues.quotationId, id))
    .all()

  const items = db
    .select()
    .from(quotationItems)
    .where(eq(quotationItems.quotationId, id))
    .orderBy(asc(quotationItems.displayOrder))
    .all()
    .map((item) => ({
      ...item,
      columnValues: parseColumnValues(item.columnValues)
    }))

  const charges = db
    .select()
    .from(quotationCharges)
    .where(eq(quotationCharges.quotationId, id))
    .all()

  return {
    ...row.quotation,
    customerName: row.customerName,
    templateName: row.templateName,
    customValues,
    items,
    charges
  }
}

function replaceChildren(
  quotationId: number,
  customValues: QuotationCustomValueInput[],
  items: QuotationItemInput[],
  charges: QuotationChargeInput[],
  totals: ReturnType<typeof computeTotals>
): void {
  const db = getDatabase()

  db.delete(quotationCustomValues).where(eq(quotationCustomValues.quotationId, quotationId)).run()
  db.delete(quotationItems).where(eq(quotationItems.quotationId, quotationId)).run()
  db.delete(quotationCharges).where(eq(quotationCharges.quotationId, quotationId)).run()

  for (const value of customValues) {
    db.insert(quotationCustomValues)
      .values({
        quotationId,
        fieldDefinitionId: value.fieldDefinitionId,
        value: value.value
      })
      .run()
  }

  items.forEach((item, index) => {
    db.insert(quotationItems)
      .values({
        quotationId,
        displayOrder: index,
        productId: item.productId ?? null,
        qty: item.qty,
        rate: item.rate,
        discount: item.discount ?? 0,
        discountType: item.discountType ?? 'fixed',
        taxPercent: item.taxPercent ?? 0,
        amount: totals.lines[index]?.amount ?? 0,
        columnValues: JSON.stringify(item.columnValues ?? {})
      })
      .run()
  })

  charges.forEach((charge, index) => {
    db.insert(quotationCharges)
      .values({
        quotationId,
        name: charge.name.trim(),
        type: charge.type,
        value: charge.value,
        appliesToSubtotal: charge.appliesToSubtotal ?? true,
        amount: totals.charges[index]?.amount ?? 0
      })
      .run()
  })
}

async function insertQuotationWithNumber(
  data: QuotationInput,
  extras: {
    status: QuotationStatus
    parentQuotationId?: number | null
    revisionNumber?: number
    createdBy?: string | null
  }
): Promise<number> {
  const db = getDatabase()
  const customValues = data.customValues ?? []
  const items = data.items ?? []
  const charges = data.charges ?? []
  assertCustomValues(customValues)

  const totals = computeTotals(items, charges, data.discountTotal ?? 0)
  const timestamp = now()

  for (let attempt = 0; attempt < 8; attempt += 1) {
    const quotationNumber = await allocateQuotationNumber()
    try {
      const result = db
        .insert(quotations)
        .values({
          quotationNumber,
          date: data.date,
          customerId: data.customerId,
          templateId: data.templateId,
          status: extras.status,
          currency: data.currency ?? 'INR',
          subtotal: totals.subtotal,
          discountTotal: totals.discountTotal,
          taxTotal: totals.taxTotal,
          grandTotal: totals.grandTotal,
          notesInternal: emptyToNull(data.notesInternal),
          notesCustomer: emptyToNull(data.notesCustomer),
          parentQuotationId: extras.parentQuotationId ?? null,
          revisionNumber: extras.revisionNumber ?? 0,
          createdBy: extras.createdBy ?? null,
          createdAt: timestamp,
          updatedAt: timestamp
        })
        .run()

      const quotationId = Number(result.lastInsertRowid)
      replaceChildren(quotationId, customValues, items, charges, totals)
      return quotationId
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      if (!/UNIQUE|unique/i.test(message) || attempt === 7) {
        throw error
      }
    }
  }

  throw new Error('Failed to allocate a unique quotation number')
}

export async function listQuotations(search?: string): Promise<QuotationListItem[]> {
  const db = getDatabase()
  const query = search?.trim()

  const rows = query
    ? db
        .select({
          quotation: quotations,
          customerName: customers.name,
          templateName: quotationTemplates.name
        })
        .from(quotations)
        .leftJoin(customers, eq(quotations.customerId, customers.id))
        .leftJoin(quotationTemplates, eq(quotations.templateId, quotationTemplates.id))
        .where(
          or(
            like(quotations.quotationNumber, `%${query}%`),
            like(customers.name, `%${query}%`),
            like(quotations.status, `%${query}%`)
          )
        )
        .orderBy(desc(quotations.updatedAt))
        .all()
    : db
        .select({
          quotation: quotations,
          customerName: customers.name,
          templateName: quotationTemplates.name
        })
        .from(quotations)
        .leftJoin(customers, eq(quotations.customerId, customers.id))
        .leftJoin(quotationTemplates, eq(quotations.templateId, quotationTemplates.id))
        .orderBy(desc(quotations.updatedAt))
        .all()

  return rows.map((row) => ({
    ...row.quotation,
    customerName: row.customerName,
    templateName: row.templateName
  }))
}

export async function getQuotation(id: number): Promise<QuotationBundle | null> {
  return loadBundle(id)
}

export async function createQuotation(data: QuotationInput): Promise<QuotationBundle> {
  const id = await insertQuotationWithNumber(data, {
    status: data.status ?? 'Draft'
  })
  const bundle = loadBundle(id)
  if (!bundle) throw new Error('Failed to create quotation')
  return bundle
}

export async function updateQuotation(id: number, data: QuotationInput): Promise<QuotationBundle> {
  const db = getDatabase()
  const existing = db.select().from(quotations).where(eq(quotations.id, id)).get()
  if (!existing) throw new Error('Quotation not found')

  const customValues = data.customValues ?? []
  const items = data.items ?? []
  const charges = data.charges ?? []
  assertCustomValues(customValues)

  const totals = computeTotals(items, charges, data.discountTotal ?? 0)

  db.update(quotations)
    .set({
      date: data.date,
      customerId: data.customerId,
      templateId: data.templateId,
      status: data.status ?? existing.status,
      currency: data.currency ?? existing.currency,
      subtotal: totals.subtotal,
      discountTotal: totals.discountTotal,
      taxTotal: totals.taxTotal,
      grandTotal: totals.grandTotal,
      notesInternal: emptyToNull(data.notesInternal),
      notesCustomer: emptyToNull(data.notesCustomer),
      updatedAt: now()
    })
    .where(eq(quotations.id, id))
    .run()

  replaceChildren(id, customValues, items, charges, totals)

  const bundle = loadBundle(id)
  if (!bundle) throw new Error('Quotation not found after update')
  return bundle
}

export async function setQuotationStatus(id: number, status: QuotationStatus): Promise<QuotationBundle> {
  const db = getDatabase()
  const existing = db.select().from(quotations).where(eq(quotations.id, id)).get()
  if (!existing) throw new Error('Quotation not found')

  db.update(quotations)
    .set({ status, updatedAt: now() })
    .where(eq(quotations.id, id))
    .run()

  const bundle = loadBundle(id)
  if (!bundle) throw new Error('Quotation not found')
  return bundle
}

export async function finalizeQuotation(id: number): Promise<QuotationBundle> {
  return setQuotationStatus(id, 'Finalized')
}

export async function removeQuotation(id: number): Promise<void> {
  const db = getDatabase()
  db.delete(quotations).where(eq(quotations.id, id)).run()
}

function bundleToInput(bundle: QuotationBundle, overrides?: Partial<QuotationInput>): QuotationInput {
  return {
    date: overrides?.date ?? bundle.date,
    customerId: overrides?.customerId ?? bundle.customerId,
    templateId: overrides?.templateId ?? bundle.templateId,
    status: overrides?.status ?? 'Draft',
    currency: overrides?.currency ?? bundle.currency,
    discountTotal: overrides?.discountTotal ?? bundle.discountTotal,
    notesInternal: overrides?.notesInternal ?? bundle.notesInternal,
    notesCustomer: overrides?.notesCustomer ?? bundle.notesCustomer,
    customValues: bundle.customValues.map((value) => ({
      fieldDefinitionId: value.fieldDefinitionId,
      value: value.value
    })),
    items: bundle.items.map((item) => ({
      productId: item.productId,
      qty: item.qty,
      rate: item.rate,
      discount: item.discount,
      discountType: item.discountType,
      taxPercent: item.taxPercent,
      columnValues: item.columnValues
    })),
    charges: bundle.charges.map((charge) => ({
      name: charge.name,
      type: charge.type,
      value: charge.value,
      appliesToSubtotal: charge.appliesToSubtotal
    }))
  }
}

export async function duplicateQuotation(id: number): Promise<QuotationBundle> {
  const source = loadBundle(id)
  if (!source) throw new Error('Quotation not found')

  const newId = await insertQuotationWithNumber(bundleToInput(source, { status: 'Draft' }), {
    status: 'Draft',
    parentQuotationId: null,
    revisionNumber: 0
  })

  const bundle = loadBundle(newId)
  if (!bundle) throw new Error('Failed to duplicate quotation')
  return bundle
}

export async function reviseQuotation(id: number): Promise<QuotationBundle> {
  const db = getDatabase()
  const source = loadBundle(id)
  if (!source) throw new Error('Quotation not found')

  const rootId = source.parentQuotationId ?? source.id
  const maxRevision = db
    .select({ value: sql<number>`coalesce(max(${quotations.revisionNumber}), 0)` })
    .from(quotations)
    .where(or(eq(quotations.id, rootId), eq(quotations.parentQuotationId, rootId)))
    .get()

  const nextRevision = (maxRevision?.value ?? source.revisionNumber) + 1

  // Mark original lineage tip as Revised when creating a new revision from it.
  db.update(quotations)
    .set({ status: 'Revised', updatedAt: now() })
    .where(eq(quotations.id, id))
    .run()

  const newId = await insertQuotationWithNumber(bundleToInput(source, { status: 'Draft' }), {
    status: 'Draft',
    parentQuotationId: rootId,
    revisionNumber: nextRevision
  })

  const bundle = loadBundle(newId)
  if (!bundle) throw new Error('Failed to revise quotation')
  return bundle
}
