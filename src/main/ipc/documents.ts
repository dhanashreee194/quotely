import { BrowserWindow, dialog, ipcMain, type IpcMainEvent } from 'electron'
import { writeFileSync } from 'fs'
import { join } from 'path'
import { is } from '@electron-toolkit/utils'
import { eq, asc } from 'drizzle-orm'
import { buildQuotationPdfFilename, type QuotationDocumentModel } from '../../shared/document'
import { IpcChannels } from '../../shared/ipc'
import {
  BANK_QR_RELATIVE,
  DOCUMENT_QRS,
  HEADER_BRAND_RELATIVE,
  LETTERHEAD_RELATIVE,
  readAssetDataUrl
} from '../assets'
import { getDatabase } from '../db'
import {
  KITCHEN_CATALOG,
  BASKET_CATALOG,
  TABLE_HEADERS_FIELD_KEY,
  foldCommonUnitItems,
  parseTableHeaderOverrides
} from '../../shared/metadata'
import { customers, itemColumnDefinitions, products, termsTemplates } from '../db/schema'
import { getCompanyProfile } from './company'
import { getQuotationTemplateBundle } from './quotationTemplates'
import { getQuotation } from './quotations'

function formatCustomValue(raw: string | null, type: string): string {
  if (raw == null || raw === '') return '—'
  if (type === 'checkbox') return raw === 'true' ? 'Yes' : 'No'
  return raw
}

export async function getQuotationDocumentModel(
  quotationId: number
): Promise<QuotationDocumentModel | null> {
  const quotation = await getQuotation(quotationId)
  if (!quotation) return null

  const db = getDatabase()
  const company = await getCompanyProfile()
  const customer =
    db.select().from(customers).where(eq(customers.id, quotation.customerId)).get() ?? null
  const template = await getQuotationTemplateBundle(quotation.templateId)
  if (!template) {
    throw new Error('Quotation template not found')
  }

  const printColumns = db
    .select()
    .from(itemColumnDefinitions)
    .where(eq(itemColumnDefinitions.templateId, quotation.templateId))
    .orderBy(asc(itemColumnDefinitions.displayOrder))
    .all()
    .filter((column) => column.printInclude)

  const tableHeadersField = template.sections
    .flatMap((section) => section.fields)
    .find((field) => field.fieldKey === TABLE_HEADERS_FIELD_KEY)
  const tableHeaders = parseTableHeaderOverrides(
    tableHeadersField
      ? quotation.customValues.find((value) => value.fieldDefinitionId === tableHeadersField.id)
          ?.value
      : null
  )

  const printFields = template.sections
    .filter((section) => section.enabled)
    .flatMap((section) => section.fields)
    .filter((field) => field.printVisible && field.fieldKey !== 'notesInternal')
    .sort((a, b) => a.displayOrder - b.displayOrder)
    .map((field) => {
      const match = quotation.customValues.find((value) => value.fieldDefinitionId === field.id)
      return {
        fieldKey: field.fieldKey,
        label: field.label,
        value: formatCustomValue(match?.value ?? null, field.type),
        displayOrder: field.displayOrder
      }
    })

  const terms = db
    .select()
    .from(termsTemplates)
    .orderBy(asc(termsTemplates.displayOrder))
    .all()
    .map((term) => ({ title: term.title, body: term.body }))

  const productRows = db.select().from(products).all()
  const productById = new Map(productRows.map((row) => [row.id, row]))
  const catalogByCode = new Map(
    [...KITCHEN_CATALOG, ...BASKET_CATALOG].map((item) => [item.itemCode, item])
  )
  quotation.items = quotation.items.flatMap((item) => {
    const product = item.productId != null ? productById.get(item.productId) : undefined
    const values = { ...item.columnValues }
    if (product?.itemCode === 'TD-JG' && values.description === 'J/G Handle') {
      values.description = 'Handle'
    }
    if (typeof values.category === 'string') {
      values.category = values.category.replace(/^SLEEK\s+/i, '')
    }
    if (product?.itemCode === 'TD-JG') {
      if (values.subtype === 'J/G Handle' || values.subtype === 'J1 Handle' || values.subtype === '') {
        values.subtype = 'J Handle'
      } else if (values.subtype === 'G1 Handle') {
        values.subtype = 'G Handle'
      }
    }
    if (product?.itemCode === 'TD-COMMON' && values.description === 'Common Unit') {
      values.description = 'Corner Unit'
    }
    if (product?.itemCode === 'TD-TOPAGE') {
      if (values.subtype === 'Top Edge Square' || values.subtype === 'J/G Handle' || values.subtype === '') {
        values.subtype = 'Square'
      } else if (values.subtype === 'Top Edge Curve') {
        values.subtype = 'Curve'
      }
    }
    const image = typeof values.image === 'string' ? values.image.trim() : ''
    if (!image) {
      const catalog = product ? catalogByCode.get(product.itemCode) : undefined
      values.image = product?.imagePath || (catalog ? `products/kitchen/${catalog.image}` : '')
    }
    return [{ ...item, columnValues: values }]
  })
  const commonProduct = productRows.find((row) => row.itemCode === 'TD-COMMON')
  quotation.items = foldCommonUnitItems(
    quotation.items,
    (item) => (item.productId != null ? productById.get(item.productId)?.itemCode : undefined),
    commonProduct?.id
  )

  const imageColumnKeys = new Set(
    printColumns.filter((column) => column.dataType === 'image').map((column) => column.columnKey)
  )
  const assetDataUrls: Record<string, string> = {}
  for (const item of quotation.items) {
    for (const key of imageColumnKeys) {
      const raw = item.columnValues?.[key]
      if (typeof raw !== 'string' || !raw.trim()) continue
      if (assetDataUrls[raw]) continue
      const dataUrl = readAssetDataUrl(raw)
      if (dataUrl) assetDataUrls[raw] = dataUrl
    }
  }

  return {
    quotation,
    company,
    customer,
    printFields,
    printColumns,
    tableHeaders,
    terms,
    logoDataUrl: company?.logoPath ? readAssetDataUrl(company.logoPath) : null,
    signatureDataUrl: company?.signaturePath ? readAssetDataUrl(company.signaturePath) : null,
    letterheadDataUrl: readAssetDataUrl(LETTERHEAD_RELATIVE),
    headerBrandDataUrl: readAssetDataUrl(HEADER_BRAND_RELATIVE),
    bankQrDataUrl: readAssetDataUrl(BANK_QR_RELATIVE),
    documentQrs: DOCUMENT_QRS.flatMap((qr) => {
      const dataUrl = readAssetDataUrl(qr.relative)
      return dataUrl ? [{ label: qr.label, dataUrl }] : []
    }),
    assetDataUrls
  }
}

async function loadPreview(
  win: BrowserWindow,
  quotationId: number,
  mode: 'export' | 'print'
): Promise<void> {
  const hash = `/quotations/${quotationId}/preview?mode=${mode}`
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    await win.loadURL(`${process.env['ELECTRON_RENDERER_URL']}#${hash}`)
  } else {
    await win.loadFile(join(__dirname, '../renderer/index.html'), { hash })
  }
}

function waitForDocumentReady(win: BrowserWindow, timeoutMs = 20000): Promise<void> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      cleanup()
      reject(new Error('Timed out waiting for quotation document to render'))
    }, timeoutMs)

    const onReady = (event: IpcMainEvent): void => {
      if (event.sender.id !== win.webContents.id) return
      cleanup()
      resolve()
    }

    const cleanup = (): void => {
      clearTimeout(timer)
      ipcMain.removeListener(IpcChannels.documentsReady, onReady)
    }

    ipcMain.on(IpcChannels.documentsReady, onReady)
  })
}

async function openHiddenDocumentWindow(
  quotationId: number,
  mode: 'export' | 'print'
): Promise<BrowserWindow> {
  const win = new BrowserWindow({
    width: 900,
    height: 1200,
    show: false,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true
    }
  })

  const ready = waitForDocumentReady(win)
  await loadPreview(win, quotationId, mode)
  await ready
  await new Promise((resolve) => setTimeout(resolve, 150))
  return win
}

/**
 * Per-page PDF header (Chromium header template). Mirrors SilexLetterhead so every
 * exported page carries the same letterhead as page 1. Styles must be inline here.
 */
function buildPdfHeaderTemplate(logoDataUrl: string | null): string {
  const magenta = '#8c2f7c'
  const logo = logoDataUrl
    ? `<img src="${logoDataUrl}" style="display:block;height:58px;width:auto;max-width:100%;" />`
    : `<div style="font-size:16pt;font-weight:800;color:${magenta};">SILEX KITCHEN</div>`
  return `<div style="width:100%;box-sizing:border-box;padding:0 10mm;margin:0;font-family:Arial,'Helvetica Neue',sans-serif;-webkit-print-color-adjust:exact;">
<table style="width:100%;border-collapse:collapse;table-layout:fixed;" cellpadding="0" cellspacing="0"><tr>
<td style="width:47%;vertical-align:top;padding:0 12px 0 0;">${logo}
<div style="margin-top:8px;font-size:7.5pt;font-weight:700;color:#333;white-space:nowrap;">MODULAR KITCHEN | MODULAR FURNITURE | OFFICE FURNITURE</div></td>
<td style="width:10px;padding:2px 0;"><div style="width:1.5px;height:72px;margin:0 auto;background:#c9a0c4;"></div></td>
<td style="width:52%;vertical-align:middle;padding:0 0 0 12px;">
<div style="font-size:16pt;font-weight:800;color:${magenta};letter-spacing:0.02em;line-height:1.1;margin-bottom:4px;">SILEX KITCHEN</div>
<div style="font-size:8pt;font-weight:700;color:#111;line-height:1.35;">SHOWROOM –DHARMBHAKTI COMPLEX, OPP, BURKULE LAWNS</div>
<div style="font-size:8pt;font-weight:700;color:#111;line-height:1.35;">AMBAD LINK ROAD,NEAR SYMBIOSIS COLLEGE,NASHIK422009</div>
<div style="margin-top:3px;font-size:9pt;font-weight:600;color:#0563c1;text-decoration:underline;">admin@silexkitchen.com</div></td>
</tr></table>
<div style="border-top:2.5px solid ${magenta};margin:10px 0 0;"></div>
</div>`
}

export async function exportQuotationPdf(quotationId: number): Promise<string | null> {
  const model = await getQuotationDocumentModel(quotationId)
  if (!model) throw new Error('Quotation not found')

  const defaultPath = buildQuotationPdfFilename(
    model.quotation.quotationNumber,
    model.customer?.name ?? model.quotation.customerName
  )

  const parent = BrowserWindow.getFocusedWindow() ?? BrowserWindow.getAllWindows()[0]
  const options: Electron.SaveDialogOptions = {
    title: 'Export quotation PDF',
    defaultPath,
    filters: [{ name: 'PDF', extensions: ['pdf'] }]
  }
  const save = parent
    ? await dialog.showSaveDialog(parent, options)
    : await dialog.showSaveDialog(options)

  if (save.canceled || !save.filePath) {
    return null
  }

  const win = await openHiddenDocumentWindow(quotationId, 'export')
  try {
    const pdf = await win.webContents.printToPDF({
      landscape: false,
      printBackground: true,
      pageSize: 'A4',
      displayHeaderFooter: true,
      headerTemplate: buildPdfHeaderTemplate(model.headerBrandDataUrl),
      footerTemplate: '<span></span>',
      preferCSSPageSize: true
    })
    writeFileSync(save.filePath, pdf)
    return save.filePath
  } finally {
    if (!win.isDestroyed()) win.close()
  }
}

export async function printQuotation(quotationId: number): Promise<boolean> {
  const model = await getQuotationDocumentModel(quotationId)
  if (!model) throw new Error('Quotation not found')

  const win = await openHiddenDocumentWindow(quotationId, 'print')
  try {
    return await new Promise<boolean>((resolve, reject) => {
      win.webContents.print(
        {
          silent: false,
          printBackground: true,
          pageSize: 'A4'
        },
        (success, failureReason) => {
          if (!success) {
            if (/cancel/i.test(failureReason || '')) {
              resolve(false)
              return
            }
            reject(new Error(failureReason || 'Print failed'))
            return
          }
          resolve(true)
        }
      )
    })
  } finally {
    if (!win.isDestroyed()) win.close()
  }
}
