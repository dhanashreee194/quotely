import { describe, expect, it } from 'vitest'
import { calculateLineAmount, calculateQuotationTotals, roundMoney } from './calc'

describe('roundMoney', () => {
  it('rounds to 2 decimals', () => {
    expect(roundMoney(1.005)).toBe(1.01)
    expect(roundMoney(10.994)).toBe(10.99)
    expect(roundMoney(0)).toBe(0)
  })

  it('handles non-finite values as 0', () => {
    expect(roundMoney(Number.NaN)).toBe(0)
    expect(roundMoney(Number.POSITIVE_INFINITY)).toBe(0)
  })
})

describe('calculateLineAmount', () => {
  it('computes qty * rate with no discount', () => {
    expect(calculateLineAmount(3, 10).amount).toBe(30)
  })

  it('applies fixed per-line discount', () => {
    const result = calculateLineAmount(2, 50, 15, 'fixed')
    expect(result.base).toBe(100)
    expect(result.discountAmount).toBe(15)
    expect(result.amount).toBe(85)
  })

  it('applies percentage per-line discount', () => {
    const result = calculateLineAmount(4, 25, 10, 'percentage')
    expect(result.base).toBe(100)
    expect(result.discountAmount).toBe(10)
    expect(result.amount).toBe(90)
  })

  it('handles zero qty or rate', () => {
    expect(calculateLineAmount(0, 100).amount).toBe(0)
    expect(calculateLineAmount(5, 0).amount).toBe(0)
  })

  it('never goes below zero after discount', () => {
    expect(calculateLineAmount(1, 10, 50, 'fixed').amount).toBe(0)
  })

  it('handles large amounts', () => {
    const result = calculateLineAmount(10000, 9999.99, 5, 'percentage')
    expect(result.base).toBe(99999900)
    expect(result.discountAmount).toBe(4999995)
    expect(result.amount).toBe(94999905)
  })
})

describe('calculateQuotationTotals', () => {
  it('sums line amounts into subtotal', () => {
    const totals = calculateQuotationTotals([
      { qty: 2, rate: 100 },
      { qty: 1, rate: 50, discount: 10, discountType: 'fixed' }
    ])
    expect(totals.subtotal).toBe(240)
    expect(totals.grandTotal).toBe(240)
  })

  it('applies percentage and fixed charges', () => {
    const totals = calculateQuotationTotals(
      [{ qty: 1, rate: 1000 }],
      [
        { type: 'percentage', value: 18, appliesToSubtotal: true },
        { type: 'fixed', value: 50 }
      ]
    )
    expect(totals.subtotal).toBe(1000)
    expect(totals.taxTotal).toBe(180)
    expect(totals.otherCharges).toBe(50)
    expect(totals.grandTotal).toBe(1230)
  })

  it('applies document-level discount before grand total', () => {
    const totals = calculateQuotationTotals([{ qty: 1, rate: 200 }], [], 20)
    expect(totals.subtotal).toBe(200)
    expect(totals.discountTotal).toBe(20)
    expect(totals.grandTotal).toBe(180)
  })

  it('uses post-discount base when appliesToSubtotal is false', () => {
    const totals = calculateQuotationTotals(
      [{ qty: 1, rate: 200 }],
      [{ type: 'percentage', value: 10, appliesToSubtotal: false }],
      20
    )
    expect(totals.taxTotal).toBe(18)
    expect(totals.grandTotal).toBe(198)
  })

  it('handles multiple mixed charges and line discounts', () => {
    const totals = calculateQuotationTotals(
      [
        { qty: 2, rate: 100, discount: 10, discountType: 'percentage' },
        { qty: 1, rate: 50, discount: 5, discountType: 'fixed' }
      ],
      [
        { type: 'percentage', value: 5 },
        { type: 'percentage', value: 12 },
        { type: 'fixed', value: 25.555 }
      ]
    )
    // lines: 180 + 45 = 225
    expect(totals.subtotal).toBe(225)
    expect(totals.taxTotal).toBe(38.25) // 5% + 12% of 225
    expect(totals.otherCharges).toBe(25.56)
    expect(totals.grandTotal).toBe(288.81)
  })

  it('handles zero lines and large values', () => {
    expect(calculateQuotationTotals([]).grandTotal).toBe(0)
    const large = calculateQuotationTotals(
      [{ qty: 1_000_000, rate: 1_000_000 }],
      [{ type: 'percentage', value: 1 }]
    )
    expect(large.subtotal).toBe(1_000_000_000_000)
    expect(large.taxTotal).toBe(10_000_000_000)
    expect(large.grandTotal).toBe(1_010_000_000_000)
  })
})
