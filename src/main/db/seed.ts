import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3'
import { asc, eq } from 'drizzle-orm'
import {
  DEFAULT_ITEM_COLUMNS,
  DEFAULT_SECTION_BLUEPRINT
} from '../../shared/metadata'
import * as schema from './schema'
import {
  companyProfile,
  itemColumnDefinitions,
  quotationTemplates,
  templateSections
} from './schema'

function now(): string {
  return new Date().toISOString()
}

function insertDefaultItemColumns(
  db: BetterSQLite3Database<typeof schema>,
  templateId: number
): void {
  for (const column of DEFAULT_ITEM_COLUMNS) {
    db.insert(itemColumnDefinitions)
      .values({
        templateId,
        label: column.label,
        columnKey: column.columnKey,
        dataType: column.dataType,
        displayOrder: column.displayOrder,
        width: column.width,
        required: column.required,
        visible: true,
        printInclude: true,
        participatesInCalc: column.participatesInCalc
      })
      .run()
  }
}

export function seedDefaultQuotationTemplate(db: BetterSQLite3Database<typeof schema>): void {
  const existing = db.select({ id: quotationTemplates.id }).from(quotationTemplates).limit(1).get()
  if (existing) {
    return
  }

  const timestamp = now()
  const templateResult = db
    .insert(quotationTemplates)
    .values({
      name: 'Standard Quotation',
      description: 'Default quotation layout with standard sections and item columns.',
      isDefault: true,
      createdAt: timestamp
    })
    .run()

  const templateId = Number(templateResult.lastInsertRowid)

  for (const section of DEFAULT_SECTION_BLUEPRINT) {
    db.insert(templateSections)
      .values({
        templateId,
        name: section.name,
        type: section.type,
        displayOrder: section.displayOrder,
        enabled: true
      })
      .run()
  }

  insertDefaultItemColumns(db, templateId)
}

/**
 * Ensure every template has Image + Specs (+ other default format columns)
 * aligned with trade-quote layouts (image · description · specs · qty · unit · rate · amount).
 */
export function ensureDefaultItemFormatColumns(
  db: BetterSQLite3Database<typeof schema>
): void {
  const templates = db.select({ id: quotationTemplates.id }).from(quotationTemplates).all()
  const defaultKeys = DEFAULT_ITEM_COLUMNS.map((column) => column.columnKey)

  for (const template of templates) {
    const existing = db
      .select()
      .from(itemColumnDefinitions)
      .where(eq(itemColumnDefinitions.templateId, template.id))
      .all()
    const byKey = new Map(existing.map((column) => [column.columnKey, column]))

    for (const column of DEFAULT_ITEM_COLUMNS) {
      if (byKey.has(column.columnKey)) continue
      db.insert(itemColumnDefinitions)
        .values({
          templateId: template.id,
          label: column.label,
          columnKey: column.columnKey,
          dataType: column.dataType,
          displayOrder: column.displayOrder,
          width: column.width,
          required: column.required,
          visible: true,
          printInclude: true,
          participatesInCalc: column.participatesInCalc
        })
        .run()
    }

    const refreshed = db
      .select()
      .from(itemColumnDefinitions)
      .where(eq(itemColumnDefinitions.templateId, template.id))
      .orderBy(asc(itemColumnDefinitions.displayOrder))
      .all()

    const ordered = [
      ...DEFAULT_ITEM_COLUMNS.map((def) => refreshed.find((col) => col.columnKey === def.columnKey)),
      ...refreshed.filter((col) => !defaultKeys.includes(col.columnKey))
    ].filter((col): col is (typeof refreshed)[number] => Boolean(col))

    ordered.forEach((column, index) => {
      if (column.displayOrder === index) return
      db.update(itemColumnDefinitions)
        .set({ displayOrder: index })
        .where(eq(itemColumnDefinitions.id, column.id))
        .run()
    })
  }
}

/**
 * Seeds the demo company profile on first launch.
 * `logoPath` must already point at a copied file under userData/assets/.
 */
export function seedDemoCompanyProfile(
  db: BetterSQLite3Database<typeof schema>,
  logoPath: string
): void {
  const existing = db.select().from(companyProfile).where(eq(companyProfile.id, 1)).get()
  if (existing) {
    return
  }

  db.insert(companyProfile)
    .values({
      id: 1,
      name: 'Quotely Demo Co',
      logoPath,
      address: '100 Innovation Drive\nDemo City',
      phone: '+1 555 0100',
      email: 'hello@quotely.demo',
      website: 'https://quotely.demo',
      updatedAt: now()
    })
    .run()
}
