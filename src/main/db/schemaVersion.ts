import { existsSync, readFileSync } from 'fs'
import { join } from 'path'
import { app } from 'electron'
import type Database from 'better-sqlite3'

type Journal = {
  entries: Array<{ idx: number; tag: string }>
}

function getJournalPath(): string {
  const candidates = [
    join(__dirname, 'migrations/meta/_journal.json'),
    join(app.getAppPath(), 'src/main/db/migrations/meta/_journal.json'),
    join(app.getAppPath(), 'out/main/db/migrations/meta/_journal.json')
  ]
  for (const candidate of candidates) {
    if (existsSync(candidate)) {
      return candidate
    }
  }
  return candidates[0]
}

/** Schema version this build of Quotely expects (count of bundled migrations). */
export function getAppSchemaVersion(): number {
  const journal = JSON.parse(readFileSync(getJournalPath(), 'utf8')) as Journal
  return journal.entries.length
}

/** Schema version currently applied in the given SQLite connection. */
export function getDbSchemaVersion(sqlite: Database.Database): number {
  const table = sqlite
    .prepare(
      `SELECT COUNT(*) AS count FROM sqlite_master WHERE type = 'table' AND name = '__drizzle_migrations'`
    )
    .get() as { count: number }

  if (!table?.count) {
    return 0
  }

  const applied = sqlite.prepare(`SELECT COUNT(*) AS count FROM __drizzle_migrations`).get() as {
    count: number
  }
  return applied?.count ?? 0
}
