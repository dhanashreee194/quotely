import { describe, expect, it } from 'vitest'
import { DEFAULT_NUMBERING_CONFIG, formatQuotationNumber } from './quotation'

describe('formatQuotationNumber', () => {
  it('formats QT-YYYY-0001 with default config', () => {
    expect(formatQuotationNumber(DEFAULT_NUMBERING_CONFIG, 1, '2026')).toBe('QT-2026-0001')
  })

  it('pads sequence to configured width', () => {
    const config = { ...DEFAULT_NUMBERING_CONFIG, padding: 5 }
    expect(formatQuotationNumber(config, 42, '2026')).toBe('QT-2026-00042')
  })

  it('omits year when includeYear is false', () => {
    const config = { ...DEFAULT_NUMBERING_CONFIG, includeYear: false }
    expect(formatQuotationNumber(config, 7, '2026')).toBe('QT-0007')
  })

  it('uses a custom prefix and separator', () => {
    const config = {
      ...DEFAULT_NUMBERING_CONFIG,
      prefix: 'INV',
      separator: '/',
      includeYear: true,
      padding: 3
    }
    expect(formatQuotationNumber(config, 12, '2025')).toBe('INV/2025/012')
  })

  it('treats padding less than 1 as 1', () => {
    const config = { ...DEFAULT_NUMBERING_CONFIG, padding: 0 }
    expect(formatQuotationNumber(config, 9, '2026')).toBe('QT-2026-9')
  })
})
