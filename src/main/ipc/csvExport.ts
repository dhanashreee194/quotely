import { writeFileSync } from 'fs'
import { BrowserWindow, dialog } from 'electron'
import { asc, desc, eq, isNull } from 'drizzle-orm'
import { buildQuotationCsvFilename } from '../../shared/document'
import type { CsvExportKind } from '../../shared/dataManagement'
import { getDatabase } from '../db'
import { customers, products, quotationItems, quotationTemplates, quotations } from '../db/schema'

function escapeCsv(value: unknown): string {
  if (value == null) return ''
  let text = String(value)
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`
  if (/[",\n\r]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`
  }
  return text
}

function cellText(values: Record<string, unknown>, key: string): string {
  const raw = values[key]
  return raw == null ? '' : String(raw)
}

function toCsv(headers: string[], rows: unknown[][]): string {
  const lines = [headers.map(escapeCsv).join(',')]
  for (const row of rows) {
    lines.push(row.map(escapeCsv).join(','))
  }
  return `${lines.join('\n')}\n`
}

function defaultFilename(kind: CsvExportKind): string {
  const day = new Date().toISOString().slice(0, 10)
  return `Quotely_${kind}_${day}.csv`
}

export async function exportCsv(kind: CsvExportKind): Promise<string | null> {
  const db = getDatabase()
  let csv = ''

  if (kind === 'quotations') {
    const rows = db
      .select({
        quotation: quotations,
        customerName: customers.name,
        templateName: quotationTemplates.name
      })
      .from(quotations)
      .leftJoin(customers, eq(quotations.customerId, customers.id))
      .leftJoin(quotationTemplates, eq(quotations.templateId, quotationTemplates.id))
      .where(isNull(quotations.deletedAt))
      .orderBy(desc(quotations.updatedAt))
      .all()

    const itemRows = db
      .select()
      .from(quotationItems)
      .orderBy(asc(quotationItems.quotationId), asc(quotationItems.displayOrder))
      .all()
    const itemsByQuote = new Map<number, typeof itemRows>()
    for (const item of itemRows) {
      const list = itemsByQuote.get(item.quotationId) ?? []
      list.push(item)
      itemsByQuote.set(item.quotationId, list)
    }

    const headers = [
      'quotationNumber',
      'revision',
      'date',
      'customer',
      'template',
      'status',
      'currency',
      'category',
      'description',
      'subtype',
      'qty',
      'unit',
      'rate',
      'lineAmount',
      'subtotal',
      'discountTotal',
      'grandTotal',
      'notes'
    ]
    const csvRows: unknown[][] = []
    for (const row of rows) {
      const items = itemsByQuote.get(row.quotation.id) ?? []
      const quoteCells = [
        row.quotation.quotationNumber,
        row.quotation.revisionNumber,
        row.quotation.date,
        row.customerName,
        row.templateName,
        row.quotation.status,
        row.quotation.currency
      ]
      const totals = [
        row.quotation.subtotal,
        row.quotation.discountTotal,
        row.quotation.grandTotal,
        row.quotation.notesCustomer ?? ''
      ]
      if (items.length === 0) {
        csvRows.push([...quoteCells, '', '', '', '', '', '', '', ...totals])
        continue
      }
      for (const item of items) {
        let values: Record<string, unknown> = {}
        try {
          const parsed = JSON.parse(item.columnValues) as unknown
          if (parsed && typeof parsed === 'object') values = parsed as Record<string, unknown>
        } catch {
          values = {}
        }
        csvRows.push([
          ...quoteCells,
          cellText(values, 'category'),
          cellText(values, 'description'),
          cellText(values, 'subtype'),
          item.qty,
          cellText(values, 'unit'),
          item.rate,
          item.amount,
          ...totals
        ])
      }
    }
    csv = toCsv(headers, csvRows)
  } else if (kind === 'customers') {
    const rows = db.select().from(customers).orderBy(customers.name).all()
    csv = toCsv(
      [
        'name',
        'companyName',
        'contactPerson',
        'email',
        'phone',
        'taxNumber',
        'address',
        'billingAddress',
        'shippingAddress',
        'updatedAt'
      ],
      rows.map((row) => [
        row.name,
        row.companyName,
        row.contactPerson,
        row.email,
        row.phone,
        row.taxNumber,
        row.address,
        row.billingAddress,
        row.shippingAddress,
        row.updatedAt
      ])
    )
  } else if (kind === 'products') {
    const rows = db.select().from(products).orderBy(products.name).all()
    csv = toCsv(
      [
        'itemCode',
        'name',
        'description',
        'unit',
        'standardPrice',
        'taxPercent',
        'category',
        'hsnSac',
        'updatedAt'
      ],
      rows.map((row) => [
        row.itemCode,
        row.name,
        row.description,
        row.unit,
        row.standardPrice,
        row.taxPercent,
        row.category,
        row.hsnSac,
        row.updatedAt
      ])
    )
  } else {
    throw new Error(`Unsupported CSV export kind: ${kind}`)
  }

  const parent = BrowserWindow.getFocusedWindow() ?? BrowserWindow.getAllWindows()[0]
  const options: Electron.SaveDialogOptions = {
    title: `Export ${kind} CSV`,
    defaultPath: defaultFilename(kind),
    filters: [{ name: 'CSV', extensions: ['csv'] }]
  }
  const save = parent
    ? await dialog.showSaveDialog(parent, options)
    : await dialog.showSaveDialog(options)

  if (save.canceled || !save.filePath) {
    return null
  }

  writeFileSync(save.filePath, csv, 'utf8')
  return save.filePath
}

export async function exportQuotationCsv(quotationId: number): Promise<string | null> {
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
    .where(eq(quotations.id, quotationId))
    .get()

  if (!row || row.quotation.deletedAt) {
    throw new Error('Quotation not found')
  }

  const items = db
    .select()
    .from(quotationItems)
    .where(eq(quotationItems.quotationId, quotationId))
    .orderBy(asc(quotationItems.displayOrder))
    .all()

  const headers = [
    'quotationNumber',
    'revision',
    'date',
    'customer',
    'template',
    'status',
    'currency',
    'category',
    'description',
    'subtype',
    'qty',
    'unit',
    'rate',
    'lineAmount',
    'subtotal',
    'discountTotal',
    'grandTotal',
    'notes'
  ]
  const quoteCells = [
    row.quotation.quotationNumber,
    row.quotation.revisionNumber,
    row.quotation.date,
    row.customerName,
    row.templateName,
    row.quotation.status,
    row.quotation.currency
  ]
  const totals = [
    row.quotation.subtotal,
    row.quotation.discountTotal,
    row.quotation.grandTotal,
    row.quotation.notesCustomer ?? ''
  ]
  const csvRows: unknown[][] = []
  if (items.length === 0) {
    csvRows.push([...quoteCells, '', '', '', '', '', '', '', ...totals])
  } else {
    for (const item of items) {
      let values: Record<string, unknown> = {}
      try {
        const parsed = JSON.parse(item.columnValues) as unknown
        if (parsed && typeof parsed === 'object') values = parsed as Record<string, unknown>
      } catch {
        values = {}
      }
      csvRows.push([
        ...quoteCells,
        cellText(values, 'category'),
        cellText(values, 'description'),
        cellText(values, 'subtype'),
        item.qty,
        cellText(values, 'unit'),
        item.rate,
        item.amount,
        ...totals
      ])
    }
  }

  const csv = toCsv(headers, csvRows)
  const defaultPath = buildQuotationCsvFilename(
    row.quotation.quotationNumber,
    row.customerName
  )
  const parent = BrowserWindow.getFocusedWindow() ?? BrowserWindow.getAllWindows()[0]
  const options: Electron.SaveDialogOptions = {
    title: 'Export quotation CSV',
    defaultPath,
    filters: [{ name: 'CSV', extensions: ['csv'] }]
  }
  const save = parent
    ? await dialog.showSaveDialog(parent, options)
    : await dialog.showSaveDialog(options)

  if (save.canceled || !save.filePath) {
    return null
  }

  writeFileSync(save.filePath, csv, 'utf8')
  return save.filePath
}
