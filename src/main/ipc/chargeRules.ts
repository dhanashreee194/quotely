import { and, asc, eq } from 'drizzle-orm'
import type { ChargeRule, ChargeRuleInput } from '../../shared/types'
import { getDatabase } from '../db'
import { chargeRules } from '../db/schema'

function now(): string {
  return new Date().toISOString()
}

export async function listChargeRules(): Promise<ChargeRule[]> {
  const db = getDatabase()
  return db.select().from(chargeRules).orderBy(asc(chargeRules.name)).all()
}

export async function createChargeRule(data: ChargeRuleInput): Promise<ChargeRule> {
  const db = getDatabase()
  const timestamp = now()
  const result = db
    .insert(chargeRules)
    .values({
      name: data.name.trim(),
      type: data.type,
      value: data.value,
      appliesToSubtotal: data.appliesToSubtotal,
      createdAt: timestamp,
      updatedAt: timestamp
    })
    .run()

  const row = db
    .select()
    .from(chargeRules)
    .where(eq(chargeRules.id, Number(result.lastInsertRowid)))
    .get()
  if (!row) {
    throw new Error('Failed to create charge rule')
  }
  return row
}

export async function updateChargeRule(id: number, data: ChargeRuleInput): Promise<ChargeRule> {
  const db = getDatabase()
  db.update(chargeRules)
    .set({
      name: data.name.trim(),
      type: data.type,
      value: data.value,
      appliesToSubtotal: data.appliesToSubtotal,
      updatedAt: now()
    })
    .where(eq(chargeRules.id, id))
    .run()

  const row = db.select().from(chargeRules).where(eq(chargeRules.id, id)).get()
  if (!row) {
    throw new Error('Charge rule not found')
  }
  return row
}

export async function removeChargeRule(id: number): Promise<void> {
  const db = getDatabase()
  db.delete(chargeRules).where(and(eq(chargeRules.id, id))).run()
}
