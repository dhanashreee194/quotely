import { index, integer, real, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core'
import type { CustomFieldType, ItemColumnDataType, TemplateSectionType } from '../../shared/metadata'
import type { DiscountType, QuotationStatus } from '../../shared/quotation'

export const settings = sqliteTable('settings', {
  key: text('key').primaryKey(),
  value: text('value').notNull()
})

export const companyProfile = sqliteTable('company_profile', {
  id: integer('id').primaryKey().default(1),
  name: text('name').notNull().default(''),
  logoPath: text('logo_path'),
  address: text('address'),
  phone: text('phone'),
  email: text('email'),
  website: text('website'),
  taxRegNumber: text('tax_reg_number'),
  panNumber: text('pan_number'),
  bankDetails: text('bank_details'),
  authorizedSignatory: text('authorized_signatory'),
  signaturePath: text('signature_path'),
  footer: text('footer'),
  updatedAt: text('updated_at').notNull()
})

export const customers = sqliteTable('customers', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  companyName: text('company_name'),
  contactPerson: text('contact_person'),
  address: text('address'),
  phone: text('phone'),
  email: text('email'),
  taxNumber: text('tax_number'),
  billingAddress: text('billing_address'),
  shippingAddress: text('shipping_address'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull()
})

export const products = sqliteTable('products', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  itemCode: text('item_code').notNull(),
  name: text('name').notNull(),
  description: text('description'),
  unit: text('unit'),
  imagePath: text('image_path'),
  standardPrice: real('standard_price').notNull().default(0),
  taxPercent: real('tax_percent').notNull().default(0),
  category: text('category'),
  hsnSac: text('hsn_sac'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull()
})

export const termsTemplates = sqliteTable('terms_templates', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  title: text('title').notNull(),
  body: text('body').notNull(),
  displayOrder: integer('display_order').notNull(),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull()
})

export const chargeRules = sqliteTable('charge_rules', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  type: text('type', { enum: ['percentage', 'fixed'] }).notNull(),
  value: real('value').notNull(),
  appliesToSubtotal: integer('applies_to_subtotal', { mode: 'boolean' }).notNull().default(true),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull()
})

export const quotationTemplates = sqliteTable('quotation_template', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  description: text('description'),
  isDefault: integer('is_default', { mode: 'boolean' }).notNull().default(false),
  createdAt: text('created_at').notNull()
})

export const templateSections = sqliteTable('template_section', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  templateId: integer('template_id')
    .notNull()
    .references(() => quotationTemplates.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  type: text('type').$type<TemplateSectionType>().notNull(),
  displayOrder: integer('display_order').notNull(),
  enabled: integer('enabled', { mode: 'boolean' }).notNull().default(true)
})

/**
 * User-defined quotation fields only.
 * Reserved keys (quotationNumber, date, customerId, status, grandTotal, templateId)
 * are real quotation columns in Phase 4 — never insert those here.
 */
export const customFieldDefinitions = sqliteTable('custom_field_definition', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  templateId: integer('template_id')
    .notNull()
    .references(() => quotationTemplates.id, { onDelete: 'cascade' }),
  sectionId: integer('section_id')
    .notNull()
    .references(() => templateSections.id, { onDelete: 'cascade' }),
  fieldKey: text('field_key').notNull(),
  label: text('label').notNull(),
  type: text('type').$type<CustomFieldType>().notNull(),
  required: integer('required', { mode: 'boolean' }).notNull().default(false),
  defaultValue: text('default_value'),
  displayOrder: integer('display_order').notNull(),
  printVisible: integer('print_visible', { mode: 'boolean' }).notNull().default(true),
  readOnly: integer('read_only', { mode: 'boolean' }).notNull().default(false),
  config: text('config')
})

export const customFieldOptions = sqliteTable('custom_field_option', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  fieldDefinitionId: integer('field_definition_id')
    .notNull()
    .references(() => customFieldDefinitions.id, { onDelete: 'cascade' }),
  label: text('label').notNull(),
  value: text('value').notNull(),
  displayOrder: integer('display_order').notNull()
})

export const itemColumnDefinitions = sqliteTable('item_column_definition', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  templateId: integer('template_id')
    .notNull()
    .references(() => quotationTemplates.id, { onDelete: 'cascade' }),
  label: text('label').notNull(),
  columnKey: text('column_key').notNull(),
  dataType: text('data_type').$type<ItemColumnDataType>().notNull(),
  displayOrder: integer('display_order').notNull(),
  width: integer('width'),
  required: integer('required', { mode: 'boolean' }).notNull().default(false),
  visible: integer('visible', { mode: 'boolean' }).notNull().default(true),
  printInclude: integer('print_include', { mode: 'boolean' }).notNull().default(true),
  participatesInCalc: integer('participates_in_calc', { mode: 'boolean' }).notNull().default(false)
})

/**
 * Hybrid rule: searchable/standard quotation fields live here as real columns.
 * User-defined fields go in quotation_custom_value only.
 */
export const quotations = sqliteTable(
  'quotation',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    quotationNumber: text('quotation_number').notNull(),
    date: text('date').notNull(),
    customerId: integer('customer_id')
      .notNull()
      .references(() => customers.id),
    templateId: integer('template_id')
      .notNull()
      .references(() => quotationTemplates.id),
    status: text('status').$type<QuotationStatus>().notNull().default('Draft'),
    currency: text('currency').notNull().default('INR'),
    subtotal: real('subtotal').notNull().default(0),
    discountTotal: real('discount_total').notNull().default(0),
    taxTotal: real('tax_total').notNull().default(0),
    grandTotal: real('grand_total').notNull().default(0),
    notesInternal: text('notes_internal'),
    notesCustomer: text('notes_customer'),
    parentQuotationId: integer('parent_quotation_id'),
    revisionNumber: integer('revision_number').notNull().default(0),
    createdBy: text('created_by'),
    createdAt: text('created_at').notNull(),
    updatedAt: text('updated_at').notNull()
  },
  (table) => [
    uniqueIndex('quotation_number_uidx').on(table.quotationNumber),
    index('quotation_date_idx').on(table.date),
    index('quotation_customer_idx').on(table.customerId),
    index('quotation_status_idx').on(table.status),
    index('quotation_grand_total_idx').on(table.grandTotal),
    index('quotation_created_at_idx').on(table.createdAt),
    index('quotation_updated_at_idx').on(table.updatedAt)
  ]
)

export const quotationCustomValues = sqliteTable('quotation_custom_value', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  quotationId: integer('quotation_id')
    .notNull()
    .references(() => quotations.id, { onDelete: 'cascade' }),
  fieldDefinitionId: integer('field_definition_id')
    .notNull()
    .references(() => customFieldDefinitions.id, { onDelete: 'cascade' }),
  value: text('value')
})

export const quotationItems = sqliteTable('quotation_item', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  quotationId: integer('quotation_id')
    .notNull()
    .references(() => quotations.id, { onDelete: 'cascade' }),
  displayOrder: integer('display_order').notNull(),
  productId: integer('product_id').references(() => products.id),
  qty: real('qty').notNull().default(0),
  rate: real('rate').notNull().default(0),
  discount: real('discount').notNull().default(0),
  discountType: text('discount_type').$type<DiscountType>().notNull().default('fixed'),
  taxPercent: real('tax_percent').notNull().default(0),
  amount: real('amount').notNull().default(0),
  columnValues: text('column_values').notNull().default('{}')
})

export const quotationCharges = sqliteTable('quotation_charge', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  quotationId: integer('quotation_id')
    .notNull()
    .references(() => quotations.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  type: text('type', { enum: ['percentage', 'fixed'] }).notNull(),
  value: real('value').notNull(),
  appliesToSubtotal: integer('applies_to_subtotal', { mode: 'boolean' }).notNull().default(true),
  amount: real('amount').notNull().default(0)
})

export const auditLog = sqliteTable(
  'audit_log',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    datetime: text('datetime').notNull(),
    user: text('user'),
    action: text('action').notNull(),
    entityType: text('entity_type').notNull(),
    entityId: text('entity_id')
  },
  (table) => [
    index('audit_log_datetime_idx').on(table.datetime),
    index('audit_log_action_idx').on(table.action)
  ]
)

export type Setting = typeof settings.$inferSelect
export type CompanyProfile = typeof companyProfile.$inferSelect
export type Customer = typeof customers.$inferSelect
export type Product = typeof products.$inferSelect
export type TermsTemplate = typeof termsTemplates.$inferSelect
export type ChargeRule = typeof chargeRules.$inferSelect
export type QuotationTemplateRow = typeof quotationTemplates.$inferSelect
export type TemplateSectionRow = typeof templateSections.$inferSelect
export type CustomFieldDefinitionRow = typeof customFieldDefinitions.$inferSelect
export type CustomFieldOptionRow = typeof customFieldOptions.$inferSelect
export type ItemColumnDefinitionRow = typeof itemColumnDefinitions.$inferSelect
export type QuotationRow = typeof quotations.$inferSelect
export type QuotationCustomValueRow = typeof quotationCustomValues.$inferSelect
export type QuotationItemRow = typeof quotationItems.$inferSelect
export type QuotationChargeRow = typeof quotationCharges.$inferSelect
export type AuditLogRow = typeof auditLog.$inferSelect
