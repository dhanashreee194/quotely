import { and, eq, like, or, sql } from 'drizzle-orm'
import type { Customer, CustomerInput } from '../../shared/types'
import { getDatabase } from '../db'
import { customers } from '../db/schema'
import { recordAudit } from './audit'

function now(): string {
  return new Date().toISOString()
}

function emptyToNull(value?: string | null): string | null {
  if (value == null) return null
  const trimmed = value.trim()
  return trimmed.length === 0 ? null : trimmed
}

export async function listCustomers(search?: string): Promise<Customer[]> {
  const db = getDatabase()
  const query = search?.trim()

  if (!query) {
    return db.select().from(customers).orderBy(sql`${customers.name} collate nocase`).all()
  }

  const pattern = `%${query}%`
  return db
    .select()
    .from(customers)
    .where(
      or(
        like(customers.name, pattern),
        like(customers.companyName, pattern),
        like(customers.email, pattern)
      )
    )
    .orderBy(sql`${customers.name} collate nocase`)
    .all()
}

export async function getCustomer(id: number): Promise<Customer | null> {
  const db = getDatabase()
  return db.select().from(customers).where(eq(customers.id, id)).get() ?? null
}

export async function createCustomer(data: CustomerInput): Promise<Customer> {
  const db = getDatabase()
  const timestamp = now()
  const result = db
    .insert(customers)
    .values({
      name: data.name.trim(),
      companyName: emptyToNull(data.companyName),
      contactPerson: emptyToNull(data.contactPerson),
      address: emptyToNull(data.address),
      phone: emptyToNull(data.phone),
      email: emptyToNull(data.email),
      taxNumber: emptyToNull(data.taxNumber),
      billingAddress: emptyToNull(data.billingAddress),
      shippingAddress: emptyToNull(data.shippingAddress),
      createdAt: timestamp,
      updatedAt: timestamp
    })
    .run()

  const row = db
    .select()
    .from(customers)
    .where(eq(customers.id, Number(result.lastInsertRowid)))
    .get()
  if (!row) {
    throw new Error('Failed to create customer')
  }
  recordAudit({ action: 'create', entityType: 'customer', entityId: row.id })
  return row
}

export async function updateCustomer(id: number, data: CustomerInput): Promise<Customer> {
  const db = getDatabase()
  db.update(customers)
    .set({
      name: data.name.trim(),
      companyName: emptyToNull(data.companyName),
      contactPerson: emptyToNull(data.contactPerson),
      address: emptyToNull(data.address),
      phone: emptyToNull(data.phone),
      email: emptyToNull(data.email),
      taxNumber: emptyToNull(data.taxNumber),
      billingAddress: emptyToNull(data.billingAddress),
      shippingAddress: emptyToNull(data.shippingAddress),
      updatedAt: now()
    })
    .where(eq(customers.id, id))
    .run()

  const row = await getCustomer(id)
  if (!row) {
    throw new Error('Customer not found')
  }
  recordAudit({ action: 'edit', entityType: 'customer', entityId: row.id })
  return row
}

export async function removeCustomer(id: number): Promise<void> {
  const db = getDatabase()
  db.delete(customers).where(and(eq(customers.id, id))).run()
  recordAudit({ action: 'delete', entityType: 'customer', entityId: id })
}
