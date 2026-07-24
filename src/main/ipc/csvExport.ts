import { writeFileSync } from 'fs'
import { BrowserWindow, dialog } from 'electron'
import { desc, eq } from 'drizzle-orm'
import type { CsvExportKind } from '../../shared/dataManagement'
import { getDatabase } from '../db'
import { customers, products, quotationTemplates, quotations } from '../db/schema'

function escapeCsv(value: unknown): string {
  if (value == null) return ''
  const text = String(value)
  if (/[",\n\r]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`
  }
  return text
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
      .orderBy(desc(quotations.updatedAt))
      .all()

    csv = toCsv(
      [
        'quotationNumber',
        'date',
        'customer',
        'template',
        'status',
        'currency',
        'subtotal',
        'discountTotal',
        'taxTotal',
        'grandTotal',
        'revisionNumber',
        'updatedAt'
      ],
      rows.map((row) => [
        row.quotation.quotationNumber,
        row.quotation.date,
        row.customerName,
        row.templateName,
        row.quotation.status,
        row.quotation.currency,
        row.quotation.subtotal,
        row.quotation.discountTotal,
        row.quotation.taxTotal,
        row.quotation.grandTotal,
        row.quotation.revisionNumber,
        row.quotation.updatedAt
      ])
    )
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
