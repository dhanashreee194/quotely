import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3'
import { eq } from 'drizzle-orm'
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
