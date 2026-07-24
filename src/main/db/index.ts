import { join } from 'path'
import { app } from 'electron'
import Database from 'better-sqlite3'
import { drizzle, BetterSQLite3Database } from 'drizzle-orm/better-sqlite3'
import { migrate } from 'drizzle-orm/better-sqlite3/migrator'
import * as schema from './schema'

let db: BetterSQLite3Database<typeof schema> | null = null
let sqlite: Database.Database | null = null

function getMigrationsFolder(): string {
  if (!app.isPackaged) {
    return join(app.getAppPath(), 'src/main/db/migrations')
  }
  return join(__dirname, 'db/migrations')
}

export function initDatabase(): BetterSQLite3Database<typeof schema> {
  if (db) {
    return db
  }

  const dbPath = join(app.getPath('userData'), 'quotely.db')
  sqlite = new Database(dbPath)
  sqlite.pragma('journal_mode = WAL')

  db = drizzle(sqlite, { schema })
  migrate(db, { migrationsFolder: getMigrationsFolder() })

  return db
}

export function getDatabase(): BetterSQLite3Database<typeof schema> {
  if (!db) {
    throw new Error('Database has not been initialized. Call initDatabase() first.')
  }
  return db
}

export function closeDatabase(): void {
  if (sqlite) {
    sqlite.close()
    sqlite = null
    db = null
  }
}
