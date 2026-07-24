import { eq } from 'drizzle-orm'
import { getDatabase } from '../db'
import { settings } from '../db/schema'

export async function getSetting(key: string): Promise<string | null> {
  const db = getDatabase()
  const row = db.select().from(settings).where(eq(settings.key, key)).get()
  return row?.value ?? null
}

export async function setSetting(key: string, value: string): Promise<void> {
  const db = getDatabase()
  db.insert(settings)
    .values({ key, value })
    .onConflictDoUpdate({
      target: settings.key,
      set: { value }
    })
    .run()
}
