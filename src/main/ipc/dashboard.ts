import { and, desc, eq, gte, lt, sql } from 'drizzle-orm'
import {
  emptyDashboardSummary,
  getDashboardDateBounds,
  type DashboardMonthBucket,
  type DashboardSummary
} from '../../shared/dashboard'
import { QUOTATION_STATUSES, type QuotationStatus } from '../../shared/quotation'
import { getDatabase } from '../db'
import { customers, quotations } from '../db/schema'

function asNumber(value: unknown): number {
  const n = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(n) ? n : 0
}

export async function getDashboardSummary(): Promise<DashboardSummary> {
  const db = getDatabase()
  const bounds = getDashboardDateBounds()

  const totals = db
    .select({
      total: sql<number>`count(*)`,
      totalValueAllTime: sql<number>`coalesce(sum(${quotations.grandTotal}), 0)`
    })
    .from(quotations)
    .get()

  const total = asNumber(totals?.total)
  if (total === 0) {
    return emptyDashboardSummary('INR')
  }

  const currencyRow = db
    .select({ currency: quotations.currency })
    .from(quotations)
    .orderBy(desc(quotations.updatedAt))
    .limit(1)
    .get()
  const currency = currencyRow?.currency?.trim() || 'INR'

  const createdToday = asNumber(
    db
      .select({ count: sql<number>`count(*)` })
      .from(quotations)
      .where(
        and(
          gte(quotations.createdAt, bounds.todayStartIso),
          lt(quotations.createdAt, bounds.tomorrowStartIso)
        )
      )
      .get()?.count
  )

  const createdThisMonth = asNumber(
    db
      .select({ count: sql<number>`count(*)` })
      .from(quotations)
      .where(
        and(
          gte(quotations.createdAt, bounds.monthStartIso),
          lt(quotations.createdAt, bounds.nextMonthStartIso)
        )
      )
      .get()?.count
  )

  const totalValueThisMonth = asNumber(
    db
      .select({
        value: sql<number>`coalesce(sum(${quotations.grandTotal}), 0)`
      })
      .from(quotations)
      .where(
        and(
          gte(quotations.createdAt, bounds.monthStartIso),
          lt(quotations.createdAt, bounds.nextMonthStartIso)
        )
      )
      .get()?.value
  )

  const statusRows = db
    .select({
      status: quotations.status,
      count: sql<number>`count(*)`
    })
    .from(quotations)
    .groupBy(quotations.status)
    .all()

  const statusMap = new Map<QuotationStatus, number>()
  for (const row of statusRows) {
    statusMap.set(row.status, asNumber(row.count))
  }

  const byStatus = QUOTATION_STATUSES.map((status) => ({
    status,
    count: statusMap.get(status) ?? 0
  }))

  const byMonth: DashboardMonthBucket[] = bounds.months.map((month) => {
    const row = db
      .select({
        count: sql<number>`count(*)`,
        value: sql<number>`coalesce(sum(${quotations.grandTotal}), 0)`
      })
      .from(quotations)
      .where(and(gte(quotations.date, month.dateFrom), lt(quotations.date, month.dateToExclusive)))
      .get()

    return {
      key: month.key,
      label: month.label,
      count: asNumber(row?.count),
      value: asNumber(row?.value)
    }
  })

  const recentRows = db
    .select({
      id: quotations.id,
      quotationNumber: quotations.quotationNumber,
      customerName: customers.name,
      status: quotations.status,
      grandTotal: quotations.grandTotal,
      updatedAt: quotations.updatedAt
    })
    .from(quotations)
    .leftJoin(customers, eq(quotations.customerId, customers.id))
    .orderBy(desc(quotations.updatedAt))
    .limit(8)
    .all()

  return {
    currency,
    counts: {
      total,
      createdToday,
      createdThisMonth,
      drafts: statusMap.get('Draft') ?? 0,
      finalized: statusMap.get('Finalized') ?? 0,
      accepted: statusMap.get('Accepted') ?? 0
    },
    totalValueThisMonth,
    totalValueAllTime: asNumber(totals?.totalValueAllTime),
    recent: recentRows.map((row) => ({
      id: row.id,
      quotationNumber: row.quotationNumber,
      customerName: row.customerName,
      status: row.status,
      grandTotal: row.grandTotal,
      updatedAt: row.updatedAt
    })),
    byMonth,
    byStatus
  }
}
