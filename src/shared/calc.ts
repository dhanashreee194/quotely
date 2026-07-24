import type { DiscountType } from './quotation'

export type { DiscountType }
export type ChargeType = 'percentage' | 'fixed'

export type CalcLineInput = {
  qty: number
  rate: number
  discount?: number
  discountType?: DiscountType
}

export type CalcChargeInput = {
  type: ChargeType
  value: number
  appliesToSubtotal?: boolean
}

export type CalcLineResult = {
  base: number
  discountAmount: number
  amount: number
}

export type CalcChargeResult = {
  amount: number
  /** percentage charges count toward taxTotal; fixed toward otherCharges */
  bucket: 'tax' | 'other'
}

export type CalcTotalsResult = {
  lines: CalcLineResult[]
  charges: CalcChargeResult[]
  subtotal: number
  discountTotal: number
  taxTotal: number
  otherCharges: number
  grandTotal: number
}

/** Round to 2 decimal places using banker's-safe half-up via integer cents. */
export function roundMoney(value: number): number {
  if (!Number.isFinite(value)) {
    return 0
  }
  return Math.round((value + Number.EPSILON) * 100) / 100
}

export function calculateLineAmount(
  qty: number,
  rate: number,
  discount = 0,
  discountType: DiscountType = 'fixed'
): CalcLineResult {
  const safeQty = Number.isFinite(qty) ? qty : 0
  const safeRate = Number.isFinite(rate) ? rate : 0
  const safeDiscount = Number.isFinite(discount) ? Math.max(0, discount) : 0

  const base = roundMoney(safeQty * safeRate)
  const discountAmount = roundMoney(
    discountType === 'percentage' ? (base * safeDiscount) / 100 : Math.min(safeDiscount, base)
  )
  const amount = roundMoney(Math.max(0, base - discountAmount))

  return { base, discountAmount, amount }
}

/**
 * Quotation totals:
 * - line amount = qty * rate − per-line discount (fixed or % of qty*rate)
 * - subtotal = sum(line amounts)
 * - discountTotal = optional document-level discount (already rounded)
 * - percentage charges → taxTotal (of subtotal, or subtotal−discountTotal when appliesToSubtotal=false)
 * - fixed charges → otherCharges
 * - grandTotal = subtotal − discountTotal + taxTotal + otherCharges
 */
export function calculateQuotationTotals(
  lines: CalcLineInput[],
  charges: CalcChargeInput[] = [],
  discountTotal = 0
): CalcTotalsResult {
  const lineResults = lines.map((line) =>
    calculateLineAmount(line.qty, line.rate, line.discount ?? 0, line.discountType ?? 'fixed')
  )

  const subtotal = roundMoney(lineResults.reduce((sum, line) => sum + line.amount, 0))
  const safeDiscountTotal = roundMoney(Math.max(0, Math.min(discountTotal, subtotal)))
  const chargeBase = roundMoney(Math.max(0, subtotal - safeDiscountTotal))

  const chargeResults: CalcChargeResult[] = charges.map((charge) => {
    const value = Number.isFinite(charge.value) ? Math.max(0, charge.value) : 0
    if (charge.type === 'percentage') {
      const base = charge.appliesToSubtotal === false ? chargeBase : subtotal
      return {
        amount: roundMoney((base * value) / 100),
        bucket: 'tax' as const
      }
    }
    return {
      amount: roundMoney(value),
      bucket: 'other' as const
    }
  })

  const taxTotal = roundMoney(
    chargeResults.filter((c) => c.bucket === 'tax').reduce((sum, c) => sum + c.amount, 0)
  )
  const otherCharges = roundMoney(
    chargeResults.filter((c) => c.bucket === 'other').reduce((sum, c) => sum + c.amount, 0)
  )
  const grandTotal = roundMoney(subtotal - safeDiscountTotal + taxTotal + otherCharges)

  return {
    lines: lineResults,
    charges: chargeResults,
    subtotal,
    discountTotal: safeDiscountTotal,
    taxTotal,
    otherCharges,
    grandTotal
  }
}
