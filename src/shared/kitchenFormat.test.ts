import { describe, expect, it } from 'vitest'
import {
  foldCommonUnitItems,
  isPlySquareFootLine,
  plySquareFeet
} from './metadata'

describe('ply installation basis', () => {
  it('counts shutter square feet only', () => {
    expect(isPlySquareFootLine('SHT-KP', 'Sq.Ft.', 'BWP MARINE PLY LAMINATE SHUTTER')).toBe(true)
    expect(isPlySquareFootLine('CAB-OH', 'Sq.Ft.', 'BWP MARINE PLY CABINET')).toBe(false)
    expect(isPlySquareFootLine('CAB-OPEN', 'R.Ft.', 'BWP MARINE PLY CABINET')).toBe(false)
    expect(isPlySquareFootLine('TD-MAT', 'Sq.Ft.', 'TENDEM DRAWERS')).toBe(false)
    expect(plySquareFeet([
      { itemCode: 'SHT-KP', qty: 10.5, unit: 'Sq.Ft.', category: 'SHUTTER' },
      { itemCode: 'CAB-OH', qty: 4, unit: 'Sq.Ft.', category: 'CABINET' },
      { itemCode: 'TD-MAT', qty: 35, unit: 'Sq.Ft.', category: 'TENDEM DRAWERS' }
    ])).toBe(10.5)
  })
})

describe('foldCommonUnitItems', () => {
  it('collapses the three fittings into one Corner Unit row', () => {
    const rows = [
      {
        productId: 1,
        qty: 1,
        columnValues: { description: 'Tendem Drawer', category: 'SLEEK TENDEM DRAWERS' }
      },
      {
        productId: 2,
        qty: 0,
        columnValues: { description: 'Magic Corner', category: 'COMMON UNIT', subtype: '' }
      },
      {
        productId: 3,
        qty: 2,
        columnValues: { description: 'Swing Tray', category: 'COMMON UNIT', subtype: '' }
      }
    ]
    const folded = foldCommonUnitItems(rows, (row) => {
      if (row.productId === 2) return 'TD-MAGIC'
      if (row.productId === 3) return 'TD-SWING'
      return 'TD-DRAWER'
    }, 9)
    expect(folded).toHaveLength(2)
    expect(folded[0].columnValues?.category).toBe('TENDEM DRAWERS')
    expect(folded[1].columnValues?.description).toBe('Corner Unit')
    expect(folded[1].columnValues?.subtype).toBe('Swing Tray')
    expect(folded[1].productId).toBe(9)
    expect(
      foldCommonUnitItems(folded, (row) => (row.productId === 9 ? 'TD-COMMON' : 'TD-DRAWER'), 9)
    ).toBe(folded)
  })
})
