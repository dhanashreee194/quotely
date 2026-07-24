import { describe, expect, it } from 'vitest'
import { formatLocalDateKey, formatYearMonth, getDashboardDateBounds } from './dashboard'

describe('getDashboardDateBounds', () => {
  it('buckets today / this month and the last 6 months in local time', () => {
    // Mid-month afternoon — avoids DST edge ambiguity for most zones.
    const now = new Date(2026, 6, 24, 15, 30, 0, 0) // 24 Jul 2026 local
    const bounds = getDashboardDateBounds(now)

    expect(bounds.todayStartIso).toBe(new Date(2026, 6, 24, 0, 0, 0, 0).toISOString())
    expect(bounds.tomorrowStartIso).toBe(new Date(2026, 6, 25, 0, 0, 0, 0).toISOString())
    expect(bounds.monthStartIso).toBe(new Date(2026, 6, 1, 0, 0, 0, 0).toISOString())
    expect(bounds.nextMonthStartIso).toBe(new Date(2026, 7, 1, 0, 0, 0, 0).toISOString())

    expect(bounds.months).toHaveLength(6)
    expect(bounds.months.map((m) => m.key)).toEqual([
      '2026-02',
      '2026-03',
      '2026-04',
      '2026-05',
      '2026-06',
      '2026-07'
    ])
    expect(bounds.months[0]).toMatchObject({
      key: '2026-02',
      label: 'Feb 2026',
      dateFrom: '2026-02-01',
      dateToExclusive: '2026-03-01'
    })
    expect(bounds.months[5]).toMatchObject({
      key: '2026-07',
      dateFrom: '2026-07-01',
      dateToExclusive: '2026-08-01'
    })
  })

  it('rolls year correctly across January', () => {
    const now = new Date(2026, 0, 5, 12, 0, 0, 0) // 5 Jan 2026
    const keys = getDashboardDateBounds(now).months.map((m) => m.key)
    expect(keys).toEqual(['2025-08', '2025-09', '2025-10', '2025-11', '2025-12', '2026-01'])
  })

  it('formats year-month and local date keys', () => {
    expect(formatYearMonth(2026, 0)).toBe('2026-01')
    expect(formatYearMonth(2026, 11)).toBe('2026-12')
    expect(formatLocalDateKey(new Date(2026, 6, 4))).toBe('2026-07-04')
  })
})
