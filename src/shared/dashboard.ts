import type { QuotationStatus } from './quotation'
import { QUOTATION_STATUSES } from './quotation'

export type DashboardCounts = {
  total: number
  createdToday: number
  createdThisMonth: number
  drafts: number
  finalized: number
  accepted: number
}

export type DashboardRecentQuotation = {
  id: number
  quotationNumber: string
  customerName: string | null
  status: QuotationStatus
  grandTotal: number
  updatedAt: string
}

export type DashboardMonthBucket = {
  /** YYYY-MM */
  key: string
  label: string
  count: number
  value: number
}

export type DashboardStatusCount = {
  status: QuotationStatus
  count: number
}

export type DashboardSummary = {
  currency: string
  counts: DashboardCounts
  totalValueThisMonth: number
  totalValueAllTime: number
  recent: DashboardRecentQuotation[]
  byMonth: DashboardMonthBucket[]
  byStatus: DashboardStatusCount[]
}

export type DashboardMonthWindow = {
  key: string
  label: string
  /** Inclusive YYYY-MM-DD (quotation.date) */
  dateFrom: string
  /** Exclusive YYYY-MM-DD */
  dateToExclusive: string
}

export type DashboardDateBounds = {
  /** Inclusive ISO timestamp for createdAt comparisons */
  todayStartIso: string
  /** Exclusive ISO timestamp */
  tomorrowStartIso: string
  /** Inclusive ISO timestamp */
  monthStartIso: string
  /** Exclusive ISO timestamp */
  nextMonthStartIso: string
  /** Last 6 calendar months (oldest → newest), for quotation.date bucketing */
  months: DashboardMonthWindow[]
}

function pad2(value: number): string {
  return String(value).padStart(2, '0')
}

export function formatYearMonth(year: number, monthIndex: number): string {
  return `${year}-${pad2(monthIndex + 1)}`
}

export function formatLocalDateKey(date: Date): string {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`
}

/**
 * Compute dashboard date windows in the local timezone.
 * Pure helper — unit-tested; used by the main-process summary query.
 */
export function getDashboardDateBounds(now: Date = new Date()): DashboardDateBounds {
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0)
  const tomorrowStart = new Date(todayStart)
  tomorrowStart.setDate(tomorrowStart.getDate() + 1)

  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0)
  const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1, 0, 0, 0, 0)

  const months: DashboardMonthWindow[] = []
  for (let offset = 5; offset >= 0; offset -= 1) {
    const start = new Date(now.getFullYear(), now.getMonth() - offset, 1, 0, 0, 0, 0)
    const endExclusive = new Date(start.getFullYear(), start.getMonth() + 1, 1, 0, 0, 0, 0)
    months.push({
      key: formatYearMonth(start.getFullYear(), start.getMonth()),
      label: start.toLocaleString('en-US', { month: 'short', year: 'numeric' }),
      dateFrom: formatLocalDateKey(start),
      dateToExclusive: formatLocalDateKey(endExclusive)
    })
  }

  return {
    todayStartIso: todayStart.toISOString(),
    tomorrowStartIso: tomorrowStart.toISOString(),
    monthStartIso: monthStart.toISOString(),
    nextMonthStartIso: nextMonthStart.toISOString(),
    months
  }
}

export function emptyDashboardSummary(currency = 'INR'): DashboardSummary {
  return {
    currency,
    counts: {
      total: 0,
      createdToday: 0,
      createdThisMonth: 0,
      drafts: 0,
      finalized: 0,
      accepted: 0
    },
    totalValueThisMonth: 0,
    totalValueAllTime: 0,
    recent: [],
    byMonth: getDashboardDateBounds().months.map((month) => ({
      key: month.key,
      label: month.label,
      count: 0,
      value: 0
    })),
    byStatus: QUOTATION_STATUSES.map((status) => ({ status, count: 0 }))
  }
}
