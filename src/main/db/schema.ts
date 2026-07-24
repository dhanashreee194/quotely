import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core'

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

export type Setting = typeof settings.$inferSelect
export type CompanyProfile = typeof companyProfile.$inferSelect
export type Customer = typeof customers.$inferSelect
export type Product = typeof products.$inferSelect
export type TermsTemplate = typeof termsTemplates.$inferSelect
export type ChargeRule = typeof chargeRules.$inferSelect
