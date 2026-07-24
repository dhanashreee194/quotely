import type { QuotationStatus } from './quotation'

export type QuotationListFilters = {
  /** Matches quotation.quotationNumber only (indexed column). */
  search?: string
  customerId?: number | null
  status?: QuotationStatus | ''
  dateFrom?: string
  dateTo?: string
  amountMin?: number | null
  amountMax?: number | null
}

export type BackupManifest = {
  appVersion: string
  /** Number of applied Drizzle migrations (monotonic schema version). */
  schemaVersion: number
  createdAt: string
}

export type BackupCreateResult = {
  path: string
}

export type BackupRestoreResult = {
  integrityCheck: string
  safetyBackupPath: string
  restoredFrom: string
}

export type AuditAction =
  | 'create'
  | 'edit'
  | 'finalize'
  | 'revise'
  | 'delete'
  | 'status_change'
  | 'template_change'
  | 'backup'
  | 'restore'
  | 'duplicate'

export type AuditEntityType =
  | 'quotation'
  | 'customer'
  | 'product'
  | 'template'
  | 'company'
  | 'backup'
  | 'system'

export type AuditLogEntry = {
  id: number
  datetime: string
  user: string | null
  action: string
  entityType: string
  entityId: string | null
}

export type AuditLogFilters = {
  dateFrom?: string
  dateTo?: string
  action?: string
}

export type CsvExportKind = 'quotations' | 'customers' | 'products'
