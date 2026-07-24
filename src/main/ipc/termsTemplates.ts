import { and, asc, eq, gt, lt, sql } from 'drizzle-orm'
import type { ReorderDirection, TermsTemplate, TermsTemplateInput } from '../../shared/types'
import { getDatabase } from '../db'
import { termsTemplates } from '../db/schema'

function now(): string {
  return new Date().toISOString()
}

export async function listTermsTemplates(): Promise<TermsTemplate[]> {
  const db = getDatabase()
  return db.select().from(termsTemplates).orderBy(asc(termsTemplates.displayOrder)).all()
}

export async function createTermsTemplate(data: TermsTemplateInput): Promise<TermsTemplate> {
  const db = getDatabase()
  const timestamp = now()
  const maxOrder = db
    .select({ value: sql<number>`coalesce(max(${termsTemplates.displayOrder}), -1)` })
    .from(termsTemplates)
    .get()

  const result = db
    .insert(termsTemplates)
    .values({
      title: data.title.trim(),
      body: data.body,
      displayOrder: (maxOrder?.value ?? -1) + 1,
      createdAt: timestamp,
      updatedAt: timestamp
    })
    .run()

  const row = db
    .select()
    .from(termsTemplates)
    .where(eq(termsTemplates.id, Number(result.lastInsertRowid)))
    .get()
  if (!row) {
    throw new Error('Failed to create terms template')
  }
  return row
}

export async function updateTermsTemplate(
  id: number,
  data: TermsTemplateInput
): Promise<TermsTemplate> {
  const db = getDatabase()
  db.update(termsTemplates)
    .set({
      title: data.title.trim(),
      body: data.body,
      updatedAt: now()
    })
    .where(eq(termsTemplates.id, id))
    .run()

  const row = db.select().from(termsTemplates).where(eq(termsTemplates.id, id)).get()
  if (!row) {
    throw new Error('Terms template not found')
  }
  return row
}

export async function removeTermsTemplate(id: number): Promise<void> {
  const db = getDatabase()
  db.delete(termsTemplates).where(and(eq(termsTemplates.id, id))).run()
}

export async function reorderTermsTemplate(
  id: number,
  direction: ReorderDirection
): Promise<TermsTemplate[]> {
  const db = getDatabase()
  const current = db.select().from(termsTemplates).where(eq(termsTemplates.id, id)).get()
  if (!current) {
    throw new Error('Terms template not found')
  }

  const neighbor =
    direction === 'up'
      ? db
          .select()
          .from(termsTemplates)
          .where(lt(termsTemplates.displayOrder, current.displayOrder))
          .orderBy(sql`${termsTemplates.displayOrder} desc`)
          .limit(1)
          .get()
      : db
          .select()
          .from(termsTemplates)
          .where(gt(termsTemplates.displayOrder, current.displayOrder))
          .orderBy(asc(termsTemplates.displayOrder))
          .limit(1)
          .get()

  if (!neighbor) {
    return listTermsTemplates()
  }

  const timestamp = now()
  db.update(termsTemplates)
    .set({ displayOrder: neighbor.displayOrder, updatedAt: timestamp })
    .where(eq(termsTemplates.id, current.id))
    .run()
  db.update(termsTemplates)
    .set({ displayOrder: current.displayOrder, updatedAt: timestamp })
    .where(eq(termsTemplates.id, neighbor.id))
    .run()

  return listTermsTemplates()
}
