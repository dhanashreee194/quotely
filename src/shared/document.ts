import type {
  CompanyProfile,
  Customer,
  ItemColumnDefinition,
  QuotationBundle
} from './types'

export type PrintField = {
  fieldKey: string
  label: string
  value: string
  displayOrder: number
}

export type PrintTermsBlock = {
  title: string
  body: string
}

export type QuotationDocumentModel = {
  quotation: QuotationBundle
  company: CompanyProfile | null
  customer: Customer | null
  printFields: PrintField[]
  printColumns: ItemColumnDefinition[]
  terms: PrintTermsBlock[]
  logoDataUrl: string | null
  signatureDataUrl: string | null
  /** Letterhead banner printed at the top of quote pages (null when not installed). */
  letterheadDataUrl: string | null
  /** Bank / payment QR code shown next to bank details (null when not installed). */
  bankQrDataUrl: string | null
  /** Relative asset path → data URL for line-item / product images. */
  assetDataUrls: Record<string, string>
}

export function sanitizeFilenamePart(value: string): string {
  return value
    .trim()
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, '')
    .replace(/\s+/g, '_')
    .slice(0, 80) || 'Customer'
}

export function buildQuotationPdfFilename(
  quotationNumber: string,
  customerName: string | null | undefined
): string {
  const numberPart = sanitizeFilenamePart(quotationNumber)
  const customerPart = sanitizeFilenamePart(customerName ?? 'Customer')
  return `Quotation_${numberPart}_${customerPart}.pdf`
}
