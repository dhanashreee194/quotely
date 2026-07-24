import { and, asc, eq, gt, lt, ne, sql } from 'drizzle-orm'
import {
  DEFAULT_ITEM_COLUMNS,
  DEFAULT_SECTION_BLUEPRINT,
  isReservedQuotationFieldKey
} from '../../shared/metadata'
import type {
  CustomFieldDefinitionInput,
  CustomFieldDefinitionWithOptions,
  CustomFieldOptionInput,
  ItemColumnDefinition,
  ItemColumnDefinitionInput,
  QuotationTemplate,
  QuotationTemplateBundle,
  QuotationTemplateInput,
  ReorderDirection,
  TemplateSection,
  TemplateSectionInput,
  TemplateSectionWithFields
} from '../../shared/types'
import { getDatabase } from '../db'
import { recordAudit } from './audit'
import {
  customFieldDefinitions,
  customFieldOptions,
  itemColumnDefinitions,
  quotationTemplates,
  templateSections
} from '../db/schema'

function now(): string {
  return new Date().toISOString()
}

function emptyToNull(value?: string | null): string | null {
  if (value == null) return null
  const trimmed = value.trim()
  return trimmed.length === 0 ? null : trimmed
}

function assertFieldKeyAllowed(fieldKey: string): void {
  const key = fieldKey.trim()
  if (!key) {
    throw new Error('fieldKey is required')
  }
  if (isReservedQuotationFieldKey(key)) {
    throw new Error(
      `"${key}" is a reserved quotation column and cannot be a custom field. Reserved: quotationNumber, date, customerId, status, grandTotal, templateId.`
    )
  }
}

function assertFieldKeyUnique(
  templateId: number,
  fieldKey: string,
  excludeFieldId?: number
): void {
  const db = getDatabase()
  const key = fieldKey.trim()
  const existing = db
    .select()
    .from(customFieldDefinitions)
    .where(
      and(
        eq(customFieldDefinitions.templateId, templateId),
        eq(customFieldDefinitions.fieldKey, key)
      )
    )
    .all()
    .find((row) => excludeFieldId == null || row.id !== excludeFieldId)

  if (existing) {
    throw new Error(
      `fieldKey "${key}" already exists on this template. Choose a unique key.`
    )
  }
}

function nextSectionOrder(templateId: number): number {
  const db = getDatabase()
  const row = db
    .select({ value: sql<number>`coalesce(max(${templateSections.displayOrder}), -1)` })
    .from(templateSections)
    .where(eq(templateSections.templateId, templateId))
    .get()
  return (row?.value ?? -1) + 1
}

function nextFieldOrder(sectionId: number): number {
  const db = getDatabase()
  const row = db
    .select({ value: sql<number>`coalesce(max(${customFieldDefinitions.displayOrder}), -1)` })
    .from(customFieldDefinitions)
    .where(eq(customFieldDefinitions.sectionId, sectionId))
    .get()
  return (row?.value ?? -1) + 1
}

function nextColumnOrder(templateId: number): number {
  const db = getDatabase()
  const row = db
    .select({ value: sql<number>`coalesce(max(${itemColumnDefinitions.displayOrder}), -1)` })
    .from(itemColumnDefinitions)
    .where(eq(itemColumnDefinitions.templateId, templateId))
    .get()
  return (row?.value ?? -1) + 1
}

function loadOptions(fieldDefinitionId: number) {
  const db = getDatabase()
  return db
    .select()
    .from(customFieldOptions)
    .where(eq(customFieldOptions.fieldDefinitionId, fieldDefinitionId))
    .orderBy(asc(customFieldOptions.displayOrder))
    .all()
}

function replaceOptions(fieldDefinitionId: number, options: CustomFieldOptionInput[]): void {
  const db = getDatabase()
  db.delete(customFieldOptions)
    .where(eq(customFieldOptions.fieldDefinitionId, fieldDefinitionId))
    .run()

  options.forEach((option, index) => {
    db.insert(customFieldOptions)
      .values({
        fieldDefinitionId,
        label: option.label.trim(),
        value: option.value.trim(),
        displayOrder: index
      })
      .run()
  })
}

export async function listQuotationTemplates(): Promise<QuotationTemplate[]> {
  const db = getDatabase()
  return db.select().from(quotationTemplates).orderBy(asc(quotationTemplates.name)).all()
}

export async function getQuotationTemplateBundle(
  id: number
): Promise<QuotationTemplateBundle | null> {
  const db = getDatabase()
  const template = db.select().from(quotationTemplates).where(eq(quotationTemplates.id, id)).get()
  if (!template) {
    return null
  }

  const sections = db
    .select()
    .from(templateSections)
    .where(eq(templateSections.templateId, id))
    .orderBy(asc(templateSections.displayOrder))
    .all()

  const sectionsWithFields: TemplateSectionWithFields[] = sections.map((section) => {
    const fields = db
      .select()
      .from(customFieldDefinitions)
      .where(eq(customFieldDefinitions.sectionId, section.id))
      .orderBy(asc(customFieldDefinitions.displayOrder))
      .all()

    const fieldsWithOptions: CustomFieldDefinitionWithOptions[] = fields.map((field) => ({
      ...field,
      options: loadOptions(field.id)
    }))

    return { ...section, fields: fieldsWithOptions }
  })

  const itemColumns = db
    .select()
    .from(itemColumnDefinitions)
    .where(eq(itemColumnDefinitions.templateId, id))
    .orderBy(asc(itemColumnDefinitions.displayOrder))
    .all()

  return {
    ...template,
    sections: sectionsWithFields,
    itemColumns
  }
}

export async function createQuotationTemplate(
  data: QuotationTemplateInput
): Promise<QuotationTemplate> {
  const db = getDatabase()
  if (data.isDefault) {
    db.update(quotationTemplates).set({ isDefault: false }).run()
  }

  const result = db
    .insert(quotationTemplates)
    .values({
      name: data.name.trim(),
      description: emptyToNull(data.description),
      isDefault: Boolean(data.isDefault),
      createdAt: now()
    })
    .run()

  const templateId = Number(result.lastInsertRowid)

  for (const section of DEFAULT_SECTION_BLUEPRINT) {
    db.insert(templateSections)
      .values({
        templateId,
        name: section.name,
        type: section.type,
        displayOrder: section.displayOrder,
        enabled: true
      })
      .run()
  }

  for (const column of DEFAULT_ITEM_COLUMNS) {
    db.insert(itemColumnDefinitions)
      .values({
        templateId,
        label: column.label,
        columnKey: column.columnKey,
        dataType: column.dataType,
        displayOrder: column.displayOrder,
        width: column.width,
        required: column.required,
        visible: true,
        printInclude: true,
        participatesInCalc: column.participatesInCalc
      })
      .run()
  }

  const row = db
    .select()
    .from(quotationTemplates)
    .where(eq(quotationTemplates.id, templateId))
    .get()
  if (!row) throw new Error('Failed to create template')
  recordAudit({ action: 'create', entityType: 'template', entityId: row.id })
  return row
}

export async function updateQuotationTemplate(
  id: number,
  data: QuotationTemplateInput
): Promise<QuotationTemplate> {
  const db = getDatabase()
  if (data.isDefault) {
    db.update(quotationTemplates).set({ isDefault: false }).where(ne(quotationTemplates.id, id)).run()
  }

  db.update(quotationTemplates)
    .set({
      name: data.name.trim(),
      description: emptyToNull(data.description),
      isDefault: Boolean(data.isDefault)
    })
    .where(eq(quotationTemplates.id, id))
    .run()

  const row = db.select().from(quotationTemplates).where(eq(quotationTemplates.id, id)).get()
  if (!row) throw new Error('Template not found')
  recordAudit({ action: 'template_change', entityType: 'template', entityId: row.id })
  return row
}

export async function removeQuotationTemplate(id: number): Promise<void> {
  const db = getDatabase()
  const template = db.select().from(quotationTemplates).where(eq(quotationTemplates.id, id)).get()
  if (!template) return

  db.delete(quotationTemplates).where(eq(quotationTemplates.id, id)).run()
  recordAudit({ action: 'delete', entityType: 'template', entityId: id })

  // If we removed the default, promote another template when any remain.
  if (template.isDefault) {
    const next = db
      .select()
      .from(quotationTemplates)
      .orderBy(asc(quotationTemplates.name))
      .limit(1)
      .get()
    if (next) {
      db.update(quotationTemplates)
        .set({ isDefault: true })
        .where(eq(quotationTemplates.id, next.id))
        .run()
    }
  }
}

export async function setDefaultQuotationTemplate(id: number): Promise<QuotationTemplate> {
  const db = getDatabase()
  const template = db.select().from(quotationTemplates).where(eq(quotationTemplates.id, id)).get()
  if (!template) throw new Error('Template not found')

  db.update(quotationTemplates).set({ isDefault: false }).run()
  db.update(quotationTemplates).set({ isDefault: true }).where(eq(quotationTemplates.id, id)).run()

  const row = db.select().from(quotationTemplates).where(eq(quotationTemplates.id, id)).get()
  if (!row) throw new Error('Template not found')
  recordAudit({ action: 'template_change', entityType: 'template', entityId: row.id })
  return row
}

export async function createTemplateSection(data: TemplateSectionInput): Promise<TemplateSection> {
  const db = getDatabase()
  const result = db
    .insert(templateSections)
    .values({
      templateId: data.templateId,
      name: data.name.trim(),
      type: data.type,
      enabled: data.enabled ?? true,
      displayOrder: nextSectionOrder(data.templateId)
    })
    .run()

  const row = db
    .select()
    .from(templateSections)
    .where(eq(templateSections.id, Number(result.lastInsertRowid)))
    .get()
  if (!row) throw new Error('Failed to create section')
  return row
}

export async function updateTemplateSection(
  id: number,
  data: Pick<TemplateSectionInput, 'name' | 'type' | 'enabled'>
): Promise<TemplateSection> {
  const db = getDatabase()
  db.update(templateSections)
    .set({
      name: data.name.trim(),
      type: data.type,
      enabled: data.enabled ?? true
    })
    .where(eq(templateSections.id, id))
    .run()

  const row = db.select().from(templateSections).where(eq(templateSections.id, id)).get()
  if (!row) throw new Error('Section not found')
  return row
}

export async function removeTemplateSection(id: number): Promise<void> {
  const db = getDatabase()
  db.delete(templateSections).where(eq(templateSections.id, id)).run()
}

export async function reorderTemplateSection(
  id: number,
  direction: ReorderDirection
): Promise<TemplateSection[]> {
  const db = getDatabase()
  const current = db.select().from(templateSections).where(eq(templateSections.id, id)).get()
  if (!current) throw new Error('Section not found')

  const neighbor =
    direction === 'up'
      ? db
          .select()
          .from(templateSections)
          .where(
            and(
              eq(templateSections.templateId, current.templateId),
              lt(templateSections.displayOrder, current.displayOrder)
            )
          )
          .orderBy(sql`${templateSections.displayOrder} desc`)
          .limit(1)
          .get()
      : db
          .select()
          .from(templateSections)
          .where(
            and(
              eq(templateSections.templateId, current.templateId),
              gt(templateSections.displayOrder, current.displayOrder)
            )
          )
          .orderBy(asc(templateSections.displayOrder))
          .limit(1)
          .get()

  if (neighbor) {
    db.update(templateSections)
      .set({ displayOrder: neighbor.displayOrder })
      .where(eq(templateSections.id, current.id))
      .run()
    db.update(templateSections)
      .set({ displayOrder: current.displayOrder })
      .where(eq(templateSections.id, neighbor.id))
      .run()
  }

  return db
    .select()
    .from(templateSections)
    .where(eq(templateSections.templateId, current.templateId))
    .orderBy(asc(templateSections.displayOrder))
    .all()
}

export async function createCustomField(
  data: CustomFieldDefinitionInput
): Promise<CustomFieldDefinitionWithOptions> {
  assertFieldKeyAllowed(data.fieldKey)
  assertFieldKeyUnique(data.templateId, data.fieldKey)
  const db = getDatabase()

  const result = db
    .insert(customFieldDefinitions)
    .values({
      templateId: data.templateId,
      sectionId: data.sectionId,
      fieldKey: data.fieldKey.trim(),
      label: data.label.trim(),
      type: data.type,
      required: data.required ?? false,
      defaultValue: emptyToNull(data.defaultValue),
      displayOrder: nextFieldOrder(data.sectionId),
      printVisible: data.printVisible ?? true,
      readOnly: data.readOnly ?? false,
      config: emptyToNull(data.config)
    })
    .run()

  const fieldId = Number(result.lastInsertRowid)
  if (data.options?.length) {
    replaceOptions(fieldId, data.options)
  }

  const row = db.select().from(customFieldDefinitions).where(eq(customFieldDefinitions.id, fieldId)).get()
  if (!row) throw new Error('Failed to create field')
  return { ...row, options: loadOptions(fieldId) }
}

export async function updateCustomField(
  id: number,
  data: Omit<CustomFieldDefinitionInput, 'templateId' | 'sectionId'>
): Promise<CustomFieldDefinitionWithOptions> {
  assertFieldKeyAllowed(data.fieldKey)
  const db = getDatabase()
  const current = db
    .select()
    .from(customFieldDefinitions)
    .where(eq(customFieldDefinitions.id, id))
    .get()
  if (!current) {
    throw new Error('Field not found')
  }
  assertFieldKeyUnique(current.templateId, data.fieldKey, id)

  db.update(customFieldDefinitions)
    .set({
      fieldKey: data.fieldKey.trim(),
      label: data.label.trim(),
      type: data.type,
      required: data.required ?? false,
      defaultValue: emptyToNull(data.defaultValue),
      printVisible: data.printVisible ?? true,
      readOnly: data.readOnly ?? false,
      config: emptyToNull(data.config)
    })
    .where(eq(customFieldDefinitions.id, id))
    .run()

  if (data.options) {
    replaceOptions(id, data.options)
  }

  const row = db.select().from(customFieldDefinitions).where(eq(customFieldDefinitions.id, id)).get()
  if (!row) throw new Error('Field not found')
  return { ...row, options: loadOptions(id) }
}

export async function removeCustomField(id: number): Promise<void> {
  const db = getDatabase()
  db.delete(customFieldDefinitions).where(eq(customFieldDefinitions.id, id)).run()
}

export async function reorderCustomField(
  id: number,
  direction: ReorderDirection
): Promise<CustomFieldDefinitionWithOptions[]> {
  const db = getDatabase()
  const current = db
    .select()
    .from(customFieldDefinitions)
    .where(eq(customFieldDefinitions.id, id))
    .get()
  if (!current) throw new Error('Field not found')

  const neighbor =
    direction === 'up'
      ? db
          .select()
          .from(customFieldDefinitions)
          .where(
            and(
              eq(customFieldDefinitions.sectionId, current.sectionId),
              lt(customFieldDefinitions.displayOrder, current.displayOrder)
            )
          )
          .orderBy(sql`${customFieldDefinitions.displayOrder} desc`)
          .limit(1)
          .get()
      : db
          .select()
          .from(customFieldDefinitions)
          .where(
            and(
              eq(customFieldDefinitions.sectionId, current.sectionId),
              gt(customFieldDefinitions.displayOrder, current.displayOrder)
            )
          )
          .orderBy(asc(customFieldDefinitions.displayOrder))
          .limit(1)
          .get()

  if (neighbor) {
    db.update(customFieldDefinitions)
      .set({ displayOrder: neighbor.displayOrder })
      .where(eq(customFieldDefinitions.id, current.id))
      .run()
    db.update(customFieldDefinitions)
      .set({ displayOrder: current.displayOrder })
      .where(eq(customFieldDefinitions.id, neighbor.id))
      .run()
  }

  const fields = db
    .select()
    .from(customFieldDefinitions)
    .where(eq(customFieldDefinitions.sectionId, current.sectionId))
    .orderBy(asc(customFieldDefinitions.displayOrder))
    .all()

  return fields.map((field) => ({ ...field, options: loadOptions(field.id) }))
}

export async function createItemColumn(
  data: ItemColumnDefinitionInput
): Promise<ItemColumnDefinition> {
  const db = getDatabase()
  const result = db
    .insert(itemColumnDefinitions)
    .values({
      templateId: data.templateId,
      label: data.label.trim(),
      columnKey: data.columnKey.trim(),
      dataType: data.dataType,
      displayOrder: nextColumnOrder(data.templateId),
      width: data.width ?? null,
      required: data.required ?? false,
      visible: data.visible ?? true,
      printInclude: data.printInclude ?? true,
      participatesInCalc: data.participatesInCalc ?? false
    })
    .run()

  const row = db
    .select()
    .from(itemColumnDefinitions)
    .where(eq(itemColumnDefinitions.id, Number(result.lastInsertRowid)))
    .get()
  if (!row) throw new Error('Failed to create item column')
  return row
}

export async function updateItemColumn(
  id: number,
  data: Omit<ItemColumnDefinitionInput, 'templateId'>
): Promise<ItemColumnDefinition> {
  const db = getDatabase()
  db.update(itemColumnDefinitions)
    .set({
      label: data.label.trim(),
      columnKey: data.columnKey.trim(),
      dataType: data.dataType,
      width: data.width ?? null,
      required: data.required ?? false,
      visible: data.visible ?? true,
      printInclude: data.printInclude ?? true,
      participatesInCalc: data.participatesInCalc ?? false
    })
    .where(eq(itemColumnDefinitions.id, id))
    .run()

  const row = db
    .select()
    .from(itemColumnDefinitions)
    .where(eq(itemColumnDefinitions.id, id))
    .get()
  if (!row) throw new Error('Item column not found')
  return row
}

export async function removeItemColumn(id: number): Promise<void> {
  const db = getDatabase()
  db.delete(itemColumnDefinitions).where(eq(itemColumnDefinitions.id, id)).run()
}

export async function reorderItemColumn(
  id: number,
  direction: ReorderDirection
): Promise<ItemColumnDefinition[]> {
  const db = getDatabase()
  const current = db
    .select()
    .from(itemColumnDefinitions)
    .where(eq(itemColumnDefinitions.id, id))
    .get()
  if (!current) throw new Error('Item column not found')

  const neighbor =
    direction === 'up'
      ? db
          .select()
          .from(itemColumnDefinitions)
          .where(
            and(
              eq(itemColumnDefinitions.templateId, current.templateId),
              lt(itemColumnDefinitions.displayOrder, current.displayOrder)
            )
          )
          .orderBy(sql`${itemColumnDefinitions.displayOrder} desc`)
          .limit(1)
          .get()
      : db
          .select()
          .from(itemColumnDefinitions)
          .where(
            and(
              eq(itemColumnDefinitions.templateId, current.templateId),
              gt(itemColumnDefinitions.displayOrder, current.displayOrder)
            )
          )
          .orderBy(asc(itemColumnDefinitions.displayOrder))
          .limit(1)
          .get()

  if (neighbor) {
    db.update(itemColumnDefinitions)
      .set({ displayOrder: neighbor.displayOrder })
      .where(eq(itemColumnDefinitions.id, current.id))
      .run()
    db.update(itemColumnDefinitions)
      .set({ displayOrder: current.displayOrder })
      .where(eq(itemColumnDefinitions.id, neighbor.id))
      .run()
  }

  return db
    .select()
    .from(itemColumnDefinitions)
    .where(eq(itemColumnDefinitions.templateId, current.templateId))
    .orderBy(asc(itemColumnDefinitions.displayOrder))
    .all()
}
