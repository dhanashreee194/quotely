import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core'
import type { CustomFieldType, ItemColumnDataType, TemplateSectionType } from '../../shared/metadata'

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
