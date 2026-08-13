import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3'
import { asc, eq } from 'drizzle-orm'
import { calculateQuotationTotals } from '../../shared/calc'
import {
  DEFAULT_CUSTOM_FIELDS,
  DEFAULT_ITEM_COLUMNS,
  DEFAULT_SECTION_BLUEPRINT,
  KITCHEN_CATALOG,
  KITCHEN_SUBTYPES_BY_CODE,
  kitchenGroupLabel
} from '../../shared/metadata'
import * as schema from './schema'
import {
  companyProfile,
  customFieldDefinitions,
  customFieldOptions,
  customers,
  itemColumnDefinitions,
  products,
  quotationCharges,
  quotationCustomValues,
  quotationItems,
  quotationTemplates,
  quotations,
  settings,
  templateSections,
  termsTemplates
} from './schema'

const CLIENT_DEMO_SETTING = 'client_demo_v3'

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
        visible: column.visible,
        printInclude: column.printInclude,
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
      name: 'Kitchen Quotation',
      description:
        'Trade quote layout matching kitchen formats — Image, Description, Qty, Unit, Total with category sections.',
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
 * Ensure every template has Excel/UXPin format columns and sync labels / print flags.
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
      const current = byKey.get(column.columnKey)
      if (!current) {
        db.insert(itemColumnDefinitions)
          .values({
            templateId: template.id,
            label: column.label,
            columnKey: column.columnKey,
            dataType: column.dataType,
            displayOrder: column.displayOrder,
            width: column.width,
            required: column.required,
            visible: column.visible,
            printInclude: column.printInclude,
            participatesInCalc: column.participatesInCalc
          })
          .run()
        continue
      }

      db.update(itemColumnDefinitions)
        .set({
          label: column.label,
          dataType: column.dataType,
          width: column.width,
          printInclude: column.printInclude,
          visible: column.visible,
          participatesInCalc: column.participatesInCalc
        })
        .where(eq(itemColumnDefinitions.id, current.id))
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

/** Ensure Sales Rep + Quote Type/Material/Finish fields exist on the default template. */
export function ensureKitchenQuoteCustomFields(
  db: BetterSQLite3Database<typeof schema>
): void {
  const template =
    db
      .select()
      .from(quotationTemplates)
      .where(eq(quotationTemplates.isDefault, true))
      .get() ?? db.select().from(quotationTemplates).limit(1).get()
  if (!template) return

  db.update(quotationTemplates)
    .set({
      name: 'Kitchen Quotation',
      description:
        'Trade quote layout matching kitchen formats — Image, Description, Qty, Unit, Total with category sections.'
    })
    .where(eq(quotationTemplates.id, template.id))
    .run()

  const sections = db
    .select()
    .from(templateSections)
    .where(eq(templateSections.templateId, template.id))
    .all()

  const sectionByType = new Map(sections.map((section) => [section.type, section]))

  for (const blueprint of DEFAULT_SECTION_BLUEPRINT) {
    if (sectionByType.has(blueprint.type)) continue
    const result = db
      .insert(templateSections)
      .values({
        templateId: template.id,
        name: blueprint.name,
        type: blueprint.type,
        displayOrder: blueprint.displayOrder,
        enabled: true
      })
      .run()
    sectionByType.set(blueprint.type, {
      id: Number(result.lastInsertRowid),
      templateId: template.id,
      name: blueprint.name,
      type: blueprint.type,
      displayOrder: blueprint.displayOrder,
      enabled: true
    })
  }

  const existingFields = db
    .select()
    .from(customFieldDefinitions)
    .where(eq(customFieldDefinitions.templateId, template.id))
    .all()
  const fieldKeys = new Set(existingFields.map((field) => field.fieldKey))

  // Sync dropdown options for fields that already exist (e.g. new finish subtypes).
  for (const field of DEFAULT_CUSTOM_FIELDS) {
    if (!field.options) continue
    const existing = existingFields.find((row) => row.fieldKey === field.fieldKey)
    if (!existing) continue
    const currentOptions = db
      .select()
      .from(customFieldOptions)
      .where(eq(customFieldOptions.fieldDefinitionId, existing.id))
      .all()
    const currentValues = new Set(currentOptions.map((option) => option.value))
    let optionOrder = currentOptions.length
    for (const option of field.options) {
      if (currentValues.has(option.value)) continue
      db.insert(customFieldOptions)
        .values({
          fieldDefinitionId: existing.id,
          label: option.label,
          value: option.value,
          displayOrder: optionOrder++
        })
        .run()
    }
  }

  let order = existingFields.length
  for (const field of DEFAULT_CUSTOM_FIELDS) {
    if (fieldKeys.has(field.fieldKey)) continue
    const section = sectionByType.get(field.sectionType)
    if (!section) continue

    const result = db
      .insert(customFieldDefinitions)
      .values({
        templateId: template.id,
        sectionId: section.id,
        fieldKey: field.fieldKey,
        label: field.label,
        type: field.type,
        required: field.required,
        defaultValue: field.defaultValue ?? null,
        displayOrder: order++,
        printVisible: field.printVisible,
        readOnly: false,
        config: null
      })
      .run()

    const fieldId = Number(result.lastInsertRowid)
    field.options?.forEach((option, index) => {
      db.insert(customFieldOptions)
        .values({
          fieldDefinitionId: fieldId,
          label: option.label,
          value: option.value,
          displayOrder: index
        })
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
      name: 'SILEX KITCHEN',
      logoPath,
      address:
        'Showroom, Dharmbhakti Complex, Opp. Burkule Lawns, Ambad Link Road, Near Symbiosis College, Nashik 422 009',
      phone: '02534032194, 9119439627',
      email: 'support@silexkitchen.com',
      website: 'www.silexkitchen.com',
      taxRegNumber: 'GST 18% applicable',
      panNumber: null,
      bankDetails: [
        'Company Name : SILEX KITCHEN',
        'Bank Name : ICICI BANK',
        'Branch : PATHARDI PHATA NASHIK',
        'Account No : 108705001572',
        'IFSC CODE : ICIC0001087',
        'Account Type : CURRENT ACCOUNT'
      ].join('\n'),
      authorizedSignatory: 'Authorized Signatory',
      signaturePath: null,
      footer: 'Modular kitchen quotations · Valid for 30 days',
      updatedAt: now()
    })
    .run()
}

function seedTermsIfEmpty(db: BetterSQLite3Database<typeof schema>): void {
  const existing = db.select({ id: termsTemplates.id }).from(termsTemplates).limit(1).get()
  if (existing) return

  const timestamp = now()
  const terms = [
    'GST 18% applicable on the above amount.',
    'Quotation will be valid for 30 days.',
    'Payment Terms : 50% Advance, 40% Before Dispatch, 10% After Fitting.',
    'In case of cancellation of order, deposited amount will not be refunded.',
    'Design and Colour Combination once finalized cannot be changed.',
    'Electrical appliances are not included.'
  ]

  terms.forEach((body, index) => {
    db.insert(termsTemplates)
      .values({
        title: `${index + 1}.`,
        body,
        displayOrder: index,
        createdAt: timestamp,
        updatedAt: timestamp
      })
      .run()
  })
}

/**
 * Backfill kitchen catalog product images / categories on existing installs
 * (matches products by itemCode; only fills missing values).
 */
export function ensureKitchenProductImages(db: BetterSQLite3Database<typeof schema>): void {
  const catalog = db.select().from(products).all()
  const byCode = new Map(catalog.map((row) => [row.itemCode, row]))
  for (const item of KITCHEN_CATALOG) {
    const existing = byCode.get(item.itemCode)
    if (!existing) continue
    const imagePath = `products/kitchen/${item.image}`
    if (existing.imagePath === imagePath && existing.category) continue
    db.update(products)
      .set({
        imagePath: existing.imagePath || imagePath,
        category: existing.category || kitchenGroupLabel(item.group),
        updatedAt: now()
      })
      .where(eq(products.id, existing.id))
      .run()
  }
}

/**
 * One-time client-demo catalog: kitchen company branding, sample customer,
 * products grouped like the Excel sheet, and a ready-to-preview quotation.
 */
export function seedClientDemoPrototype(db: BetterSQLite3Database<typeof schema>): void {
  const already = db.select().from(settings).where(eq(settings.key, CLIENT_DEMO_SETTING)).get()
  if (already) return

  seedTermsIfEmpty(db)

  const timestamp = now()
  const company = db.select().from(companyProfile).where(eq(companyProfile.id, 1)).get()
  if (company) {
    db.update(companyProfile)
      .set({
        name: 'SILEX KITCHEN',
        address:
          'Showroom, Dharmbhakti Complex, Opp. Burkule Lawns, Ambad Link Road, Near Symbiosis College, Nashik 422 009',
        phone: '02534032194, 9119439627',
        email: 'support@silexkitchen.com',
        website: 'www.silexkitchen.com',
        taxRegNumber: 'GST 18% applicable',
        bankDetails: [
          'Company Name : SILEX KITCHEN',
          'Bank Name : ICICI BANK',
          'Branch : PATHARDI PHATA NASHIK',
          'Account No : 108705001572',
          'IFSC CODE : ICIC0001087',
          'Account Type : CURRENT ACCOUNT'
        ].join('\n'),
        authorizedSignatory: 'Authorized Signatory',
        footer: 'Modular kitchen quotations · Valid for 30 days',
        updatedAt: timestamp
      })
      .where(eq(companyProfile.id, 1))
      .run()
  }

  let customer = db.select().from(customers).limit(1).get()
  if (!customer) {
    const result = db
      .insert(customers)
      .values({
        name: 'Mr. Vaibhav',
        companyName: null,
        contactPerson: 'Mr. Vaibhav',
        address: 'Nashik',
        phone: '9049774400',
        email: 'abc@gmail.com',
        taxNumber: null,
        billingAddress: 'Nashik',
        shippingAddress: 'Nashik',
        createdAt: timestamp,
        updatedAt: timestamp
      })
      .run()
    customer = db
      .select()
      .from(customers)
      .where(eq(customers.id, Number(result.lastInsertRowid)))
      .get()!
  }

  const catalogBefore = db.select().from(products).all()
  const existingCodes = new Set(catalogBefore.map((row) => row.itemCode))
  for (const item of KITCHEN_CATALOG) {
    if (existingCodes.has(item.itemCode)) continue
    db.insert(products)
      .values({
        itemCode: item.itemCode,
        name: item.name,
        description: null,
        unit: item.unit,
        imagePath: `products/kitchen/${item.image}`,
        standardPrice: item.rate,
        taxPercent: 18,
        category: kitchenGroupLabel(item.group),
        hsnSac: null,
        createdAt: timestamp,
        updatedAt: timestamp
      })
      .run()
  }
  ensureKitchenProductImages(db)

  const template =
    db
      .select()
      .from(quotationTemplates)
      .where(eq(quotationTemplates.isDefault, true))
      .get() ?? db.select().from(quotationTemplates).limit(1).get()

  const existingDemo = db
    .select({ id: quotations.id })
    .from(quotations)
    .where(eq(quotations.quotationNumber, 'QT-DEMO-001'))
    .get()
  if (template && customer && !existingDemo) {
    const catalog = db.select().from(products).all()
    const byCode = new Map(catalog.map((row) => [row.itemCode, row]))

    // All rows from the sheet, in order — including zero-qty rows, exactly like the format.
    const itemInputs = KITCHEN_CATALOG
      .map((line) => {
        const product = byCode.get(line.itemCode)
        if (!product) return null
        const subtypeOptions = KITCHEN_SUBTYPES_BY_CODE[line.itemCode]
        return {
          productId: product.id,
          qty: line.defaultQty,
          rate: product.standardPrice,
          discount: 0,
          discountType: 'fixed' as const,
          taxPercent: product.taxPercent,
          columnValues: {
            description: product.name,
            specs: product.description ?? '',
            unit: product.unit ?? '',
            image: product.imagePath ?? '',
            category: product.category ?? '',
            subtype: subtypeOptions ? subtypeOptions[0] : ''
          }
        }
      })
      .filter((row): row is NonNullable<typeof row> => Boolean(row))

    const charges = [
      {
        name: 'Installation Charges as per design',
        type: 'fixed' as const,
        value: 6488.5,
        appliesToSubtotal: true
      },
      {
        name: 'Transport',
        type: 'fixed' as const,
        value: 10000,
        appliesToSubtotal: true
      }
    ]

    const discountTotal = itemInputs.reduce((sum, item) => sum + item.qty * item.rate, 0) * 0.25
    const totals = calculateQuotationTotals(
      itemInputs.map((item) => ({
        qty: item.qty,
        rate: item.rate,
        discount: item.discount,
        discountType: item.discountType
      })),
      charges,
      discountTotal
    )

    const quoteResult = db
      .insert(quotations)
      .values({
        quotationNumber: 'QT-DEMO-001',
        revisionNumber: 0,
        date: timestamp.slice(0, 10),
        customerId: customer.id,
        templateId: template.id,
        status: 'Sent',
        currency: 'INR',
        subtotal: totals.subtotal,
        discountTotal,
        taxTotal: totals.taxTotal,
        grandTotal: totals.grandTotal,
        notesInternal: 'Client demo quotation seeded from kitchen format sheet.',
        notesCustomer: 'Thank you for choosing SILEX KITCHEN.',
        createdAt: timestamp,
        updatedAt: timestamp
      })
      .run()

    const quotationId = Number(quoteResult.lastInsertRowid)

    itemInputs.forEach((item, index) => {
      db.insert(quotationItems)
        .values({
          quotationId,
          displayOrder: index,
          productId: item.productId,
          qty: item.qty,
          rate: item.rate,
          discount: item.discount,
          discountType: item.discountType,
          taxPercent: item.taxPercent,
          amount: totals.lines[index]?.amount ?? item.qty * item.rate,
          columnValues: JSON.stringify(item.columnValues)
        })
        .run()
    })

    charges.forEach((charge, index) => {
      db.insert(quotationCharges)
        .values({
          quotationId,
          name: charge.name,
          type: charge.type,
          value: charge.value,
          appliesToSubtotal: charge.appliesToSubtotal,
          amount: totals.charges[index]?.amount ?? charge.value
        })
        .run()
    })

    const fields = db
      .select()
      .from(customFieldDefinitions)
      .where(eq(customFieldDefinitions.templateId, template.id))
      .all()
    const valuesByKey: Record<string, string> = {
      salesExecutive: 'Shahaji Thorat',
      designerName: 'Snehal Jadhav',
      designerContact: '9623953320',
      designerEmail: 'sales@silexkitchen.com',
      quoteType: 'Tendam',
      baseMaterial: 'BWP Ply',
      finish: 'Laminate'
    }
    for (const field of fields) {
      const value = valuesByKey[field.fieldKey]
      if (value == null) continue
      db.insert(quotationCustomValues)
        .values({
          quotationId,
          fieldDefinitionId: field.id,
          value
        })
        .run()
    }
  }

  db.insert(settings)
    .values({ key: CLIENT_DEMO_SETTING, value: '1' })
    .run()
}
