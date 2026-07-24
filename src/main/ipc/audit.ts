import { and, desc, eq, gte, lte, sql, type SQL } from 'drizzle-orm'
import type {
  AuditAction,
  AuditEntityType,
  AuditLogEntry,
  AuditLogFilters
} from '../../shared/dataManagement'
import { getDatabase } from '../db'
import { auditLog } from '../db/schema'

const DEFAULT_USER = 'local'

export function recordAudit(input: {
  action: AuditAction | string
  entityType: AuditEntityType | string
  entityId?: string | number | null
  user?: string | null
}): void {
  try {
    const db = getDatabase()
    db.insert(auditLog)
      .values({
        datetime: new Date().toISOString(),
        user: input.user?.trim() || DEFAULT_USER,
        action: input.action,
        entityType: input.entityType,
        entityId:
          input.entityId == null || input.entityId === ''
            ? null
            : String(input.entityId)
      })
      .run()
  } catch (error) {
    console.error('Failed to write audit log', error)
  }
}

export async function listAuditLog(filters: AuditLogFilters = {}): Promise<AuditLogEntry[]> {
  const db = getDatabase()
  const conditions: SQL[] = []

  if (filters.action?.trim()) {
    conditions.push(eq(auditLog.action, filters.action.trim()))
  }
  if (filters.dateFrom?.trim()) {
    conditions.push(gte(auditLog.datetime, `${filters.dateFrom.trim()}T00:00:00.000Z`))
  }
  if (filters.dateTo?.trim()) {
    conditions.push(lte(auditLog.datetime, `${filters.dateTo.trim()}T23:59:59.999Z`))
  }

  const rows =
    conditions.length > 0
      ? db
          .select()
          .from(auditLog)
          .where(and(...conditions))
          .orderBy(desc(auditLog.datetime), desc(auditLog.id))
          .limit(500)
          .all()
      : db
          .select()
          .from(auditLog)
          .orderBy(desc(auditLog.datetime), desc(auditLog.id))
          .limit(500)
          .all()

  return rows
}

export async function listAuditActions(): Promise<string[]> {
  const db = getDatabase()
  const rows = db
    .select({ action: auditLog.action })
    .from(auditLog)
    .groupBy(auditLog.action)
    .orderBy(sql`${auditLog.action} collate nocase`)
    .all()
  return rows.map((row) => row.action)
}
