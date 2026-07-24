export const QUOTATION_STATUSES = [
  'Draft',
  'Finalized',
  'Sent',
  'Accepted',
  'Rejected',
  'Expired',
  'Cancelled',
  'Revised'
] as const

export type QuotationStatus = (typeof QUOTATION_STATUSES)[number]

export type DiscountType = 'fixed' | 'percentage'

export const NUMBERING_SETTING_KEYS = {
  prefix: 'numbering.prefix',
  includeYear: 'numbering.includeYear',
  separator: 'numbering.separator',
  padding: 'numbering.padding',
  resetRule: 'numbering.resetRule',
  sequence: 'numbering.sequence',
  sequenceYear: 'numbering.sequenceYear'
} as const

export type NumberingResetRule = 'never' | 'yearly'

export type NumberingConfig = {
  prefix: string
  includeYear: boolean
  separator: string
  padding: number
  resetRule: NumberingResetRule
  sequence: number
  sequenceYear: string
}

export const DEFAULT_NUMBERING_CONFIG: NumberingConfig = {
  prefix: 'QT',
  includeYear: true,
  separator: '-',
  padding: 4,
  resetRule: 'yearly',
  sequence: 0,
  sequenceYear: ''
}

export function formatQuotationNumber(config: NumberingConfig, sequence: number, year: string): string {
  const padded = String(sequence).padStart(Math.max(1, config.padding), '0')
  const parts = [config.prefix]
  if (config.includeYear) {
    parts.push(year)
  }
  parts.push(padded)
  return parts.filter(Boolean).join(config.separator)
}
