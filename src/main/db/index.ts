import { existsSync } from 'fs'
import { join } from 'path'
import { app } from 'electron'
import Database from 'better-sqlite3'
import { drizzle, BetterSQLite3Database } from 'drizzle-orm/better-sqlite3'
import { migrate } from 'drizzle-orm/better-sqlite3/migrator'
import * as schema from './schema'
import { ensureDefaultItemFormatColumns, seedDefaultQuotationTemplate } from './seed'

let db: BetterSQLite3Database<typeof schema> | null = null
let sqlite: Database.Database | null = null

export function getDatabasePath(): string {
  return join(app.getPath('userData'), 'quotely.db')
}

function getMigrationsFolder(): string {
  const candidates = [
    join(__dirname, 'db/migrations'),
    join(app.getAppPath(), 'src/main/db/migrations'),
    join(app.getAppPath(), 'out/main/db/migrations')
  ]
  for (const candidate of candidates) {
    if (existsSync(join(candidate, 'meta', '_journal.json'))) {
      return candidate
    }
  }
  return candidates[0]
}

export function initDatabase(): BetterSQLite3Database<typeof schema> {
  if (db) {
    return db
  }

  const dbPath = getDatabasePath()
  sqlite = new Database(dbPath)
  sqlite.pragma('journal_mode = WAL')

  db = drizzle(sqlite, { schema })
  migrate(db, { migrationsFolder: getMigrationsFolder() })
  seedDefaultQuotationTemplate(db)
  ensureDefaultItemFormatColumns(db)

  return db
}

export function getDatabase(): BetterSQLite3Database<typeof schema> {
  if (!db) {
    throw new Error('Database has not been initialized. Call initDatabase() first.')
  }
  return db
}

export function getSqlite(): Database.Database {
  if (!sqlite) {
    throw new Error('Database has not been initialized. Call initDatabase() first.')
  }
  return sqlite
}

/** Flush WAL into the main DB file so a file copy is consistent. */
export function checkpointDatabase(): void {
  if (!sqlite) return
  sqlite.pragma('wal_checkpoint(TRUNCATE)')
}

export function closeDatabase(): void {
  if (sqlite) {
    try {
      sqlite.pragma('wal_checkpoint(TRUNCATE)')
    } catch {
      // ignore checkpoint errors during shutdown
    }
    sqlite.close()
    sqlite = null
    db = null
  }
}

export function reopenDatabase(): BetterSQLite3Database<typeof schema> {
  closeDatabase()
  return initDatabase()
}
