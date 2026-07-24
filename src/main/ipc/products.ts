import { and, eq, like, or, sql } from 'drizzle-orm'
import type { Product, ProductInput } from '../../shared/types'
import { getDatabase } from '../db'
import { products } from '../db/schema'
import { recordAudit } from './audit'

function now(): string {
  return new Date().toISOString()
}

function emptyToNull(value?: string | null): string | null {
  if (value == null) return null
  const trimmed = value.trim()
  return trimmed.length === 0 ? null : trimmed
}

export async function listProducts(search?: string): Promise<Product[]> {
  const db = getDatabase()
  const query = search?.trim()

  if (!query) {
    return db.select().from(products).orderBy(sql`${products.name} collate nocase`).all()
  }

  const pattern = `%${query}%`
  return db
    .select()
    .from(products)
    .where(
      or(
        like(products.name, pattern),
        like(products.itemCode, pattern),
        like(products.category, pattern),
        like(products.hsnSac, pattern)
      )
    )
    .orderBy(sql`${products.name} collate nocase`)
    .all()
}

export async function getProduct(id: number): Promise<Product | null> {
  const db = getDatabase()
  return db.select().from(products).where(eq(products.id, id)).get() ?? null
}

export async function createProduct(data: ProductInput): Promise<Product> {
  const db = getDatabase()
  const timestamp = now()
  const result = db
    .insert(products)
    .values({
      itemCode: data.itemCode.trim(),
      name: data.name.trim(),
      description: emptyToNull(data.description),
      unit: emptyToNull(data.unit),
      standardPrice: data.standardPrice,
      taxPercent: data.taxPercent,
      category: emptyToNull(data.category),
      hsnSac: emptyToNull(data.hsnSac),
      createdAt: timestamp,
      updatedAt: timestamp
    })
    .run()

  const row = db
    .select()
    .from(products)
    .where(eq(products.id, Number(result.lastInsertRowid)))
    .get()
  if (!row) {
    throw new Error('Failed to create product')
  }
  recordAudit({ action: 'create', entityType: 'product', entityId: row.id })
  return row
}

export async function updateProduct(id: number, data: ProductInput): Promise<Product> {
  const db = getDatabase()
  db.update(products)
    .set({
      itemCode: data.itemCode.trim(),
      name: data.name.trim(),
      description: emptyToNull(data.description),
      unit: emptyToNull(data.unit),
      standardPrice: data.standardPrice,
      taxPercent: data.taxPercent,
      category: emptyToNull(data.category),
      hsnSac: emptyToNull(data.hsnSac),
      updatedAt: now()
    })
    .where(eq(products.id, id))
    .run()

  const row = await getProduct(id)
  if (!row) {
    throw new Error('Product not found')
  }
  recordAudit({ action: 'edit', entityType: 'product', entityId: row.id })
  return row
}

export async function removeProduct(id: number): Promise<void> {
  const db = getDatabase()
  db.delete(products).where(and(eq(products.id, id))).run()
  recordAudit({ action: 'delete', entityType: 'product', entityId: id })
}
