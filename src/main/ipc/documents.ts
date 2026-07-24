import { BrowserWindow, dialog, ipcMain, type IpcMainEvent } from 'electron'
import { writeFileSync } from 'fs'
import { join } from 'path'
import { is } from '@electron-toolkit/utils'
import { eq, asc } from 'drizzle-orm'
import { buildQuotationPdfFilename, type QuotationDocumentModel } from '../../shared/document'
import { IpcChannels } from '../../shared/ipc'
import { readAssetDataUrl } from '../assets'
import { getDatabase } from '../db'
import { customers, itemColumnDefinitions, termsTemplates } from '../db/schema'
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

  return {
    quotation,
    company,
    customer,
    printFields,
    printColumns,
    terms,
    logoDataUrl: company?.logoPath ? readAssetDataUrl(company.logoPath) : null,
    signatureDataUrl: company?.signaturePath ? readAssetDataUrl(company.signaturePath) : null
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
      margins: {
        marginType: 'none'
      }
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
