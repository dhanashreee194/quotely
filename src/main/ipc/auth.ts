import { createHash, timingSafeEqual } from 'crypto'
import { eq } from 'drizzle-orm'
import { DEFAULT_USERS, defaultUserPassword } from '../../shared/metadata'
import type { SessionUser } from '../../shared/types'
import { getDatabase } from '../db'
import { users, type UserRow } from '../db/schema'

let currentUser: SessionUser | null = null

export function hashPassword(username: string, password: string): string {
  return createHash('sha256').update(`${username.toLowerCase()}:${password}`).digest('hex')
}

function toSessionUser(row: UserRow): SessionUser {
  return {
    id: row.id,
    username: row.username,
    displayName: row.displayName,
    quotePrefix: row.quotePrefix,
    isAdmin: row.isAdmin
  }
}

/** Seed the six default designer/admin accounts (idempotent). */
export function seedDefaultUsers(): void {
  const db = getDatabase()
  const existing = db.select({ username: users.username }).from(users).all()
  const usernames = new Set(existing.map((row) => row.username))
  const timestamp = new Date().toISOString()

  for (const user of DEFAULT_USERS) {
    if (usernames.has(user.username)) continue
    db.insert(users)
      .values({
        username: user.username,
        displayName: user.displayName,
        passwordHash: hashPassword(user.username, defaultUserPassword(user.username)),
        quotePrefix: user.quotePrefix,
        nextSequence: 1,
        isAdmin: user.isAdmin,
        createdAt: timestamp
      })
      .run()
  }
}

export async function login(username: string, password: string): Promise<SessionUser> {
  const db = getDatabase()
  const normalized = username.trim().toLowerCase()
  let row = db.select().from(users).where(eq(users.username, normalized)).get()
  if (!row) {
    // Self-heal: restore the default accounts if they are missing (e.g. an
    // interrupted first run), then retry the lookup once.
    seedDefaultUsers()
    row = db.select().from(users).where(eq(users.username, normalized)).get()
  }
  if (!row) {
    const known = db.select({ username: users.username }).from(users).all()
    throw new Error(
      `Unknown username "${normalized}". Available users: ${known.map((u) => u.username).join(', ')}`
    )
  }
  const provided = Buffer.from(hashPassword(normalized, password.trim()))
  const stored = Buffer.from(row.passwordHash)
  if (provided.length !== stored.length || !timingSafeEqual(provided, stored)) {
    throw new Error('Incorrect password (check capital letters — the password is all lowercase)')
  }
  currentUser = toSessionUser(row)
  return currentUser
}

export async function logout(): Promise<void> {
  currentUser = null
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  return currentUser
}

/** Synchronous accessor for main-process callers (numbering, createdBy stamping). */
export function currentSessionUser(): SessionUser | null {
  return currentUser
}

export async function listUsers(): Promise<SessionUser[]> {
  const db = getDatabase()
  return db
    .select()
    .from(users)
    .all()
    .map(toSessionUser)
}

/**
 * Allocate the next quote number for the logged-in user (SKA0001, SKA0002, …).
 * Returns null when no user is logged in (caller falls back to global numbering).
 */
export function allocateUserQuotationNumber(): string | null {
  if (!currentUser) return null
  const db = getDatabase()
  const row = db.select().from(users).where(eq(users.id, currentUser.id)).get()
  if (!row) return null
  const sequence = row.nextSequence
  db.update(users)
    .set({ nextSequence: sequence + 1 })
    .where(eq(users.id, row.id))
    .run()
  return `${row.quotePrefix}${String(sequence).padStart(4, '0')}`
}

/** Preview the next quote number for the logged-in user without consuming it. */
export function peekUserQuotationNumber(): string | null {
  if (!currentUser) return null
  const db = getDatabase()
  const row = db.select().from(users).where(eq(users.id, currentUser.id)).get()
  if (!row) return null
  return `${row.quotePrefix}${String(row.nextSequence).padStart(4, '0')}`
}
