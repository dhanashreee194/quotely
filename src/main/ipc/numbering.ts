import {
  DEFAULT_NUMBERING_CONFIG,
  NUMBERING_SETTING_KEYS,
  formatQuotationNumber,
  type NumberingConfig,
  type NumberingResetRule
} from '../../shared/quotation'
import { getSetting, setSetting } from './settings'

async function readNumberingConfig(): Promise<NumberingConfig> {
  const [
    prefix,
    includeYear,
    separator,
    padding,
    resetRule,
    sequence,
    sequenceYear
  ] = await Promise.all([
    getSetting(NUMBERING_SETTING_KEYS.prefix),
    getSetting(NUMBERING_SETTING_KEYS.includeYear),
    getSetting(NUMBERING_SETTING_KEYS.separator),
    getSetting(NUMBERING_SETTING_KEYS.padding),
    getSetting(NUMBERING_SETTING_KEYS.resetRule),
    getSetting(NUMBERING_SETTING_KEYS.sequence),
    getSetting(NUMBERING_SETTING_KEYS.sequenceYear)
  ])

  return {
    prefix: prefix ?? DEFAULT_NUMBERING_CONFIG.prefix,
    includeYear: includeYear == null ? DEFAULT_NUMBERING_CONFIG.includeYear : includeYear === 'true',
    separator: separator ?? DEFAULT_NUMBERING_CONFIG.separator,
    padding: padding ? Number(padding) : DEFAULT_NUMBERING_CONFIG.padding,
    resetRule: (resetRule as NumberingResetRule | null) ?? DEFAULT_NUMBERING_CONFIG.resetRule,
    sequence: sequence ? Number(sequence) : DEFAULT_NUMBERING_CONFIG.sequence,
    sequenceYear: sequenceYear ?? DEFAULT_NUMBERING_CONFIG.sequenceYear
  }
}

async function writeNumberingConfig(config: NumberingConfig): Promise<void> {
  await setSetting(NUMBERING_SETTING_KEYS.prefix, config.prefix)
  await setSetting(NUMBERING_SETTING_KEYS.includeYear, String(config.includeYear))
  await setSetting(NUMBERING_SETTING_KEYS.separator, config.separator)
  await setSetting(NUMBERING_SETTING_KEYS.padding, String(config.padding))
  await setSetting(NUMBERING_SETTING_KEYS.resetRule, config.resetRule)
  await setSetting(NUMBERING_SETTING_KEYS.sequence, String(config.sequence))
  await setSetting(NUMBERING_SETTING_KEYS.sequenceYear, config.sequenceYear)
}

export async function getNumberingConfig(): Promise<NumberingConfig> {
  return readNumberingConfig()
}

export async function updateNumberingConfig(
  patch: Partial<NumberingConfig>
): Promise<NumberingConfig> {
  const current = await readNumberingConfig()
  const next = { ...current, ...patch }
  await writeNumberingConfig(next)
  return next
}

/** Allocate next unique quotation number and persist the advanced sequence. */
export async function allocateQuotationNumber(): Promise<string> {
  const config = await readNumberingConfig()
  const year = String(new Date().getFullYear())

  let sequence = config.sequence
  let sequenceYear = config.sequenceYear

  if (config.resetRule === 'yearly' && sequenceYear !== year) {
    sequence = 0
    sequenceYear = year
  }

  sequence += 1
  const number = formatQuotationNumber(config, sequence, year)

  await writeNumberingConfig({
    ...config,
    sequence,
    sequenceYear
  })

  return number
}

export async function peekNextQuotationNumber(): Promise<string> {
  const config = await readNumberingConfig()
  const year = String(new Date().getFullYear())
  let sequence = config.sequence
  let sequenceYear = config.sequenceYear

  if (config.resetRule === 'yearly' && sequenceYear !== year) {
    sequence = 0
  }

  return formatQuotationNumber(config, sequence + 1, year)
}
