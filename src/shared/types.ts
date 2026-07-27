import type {
  CustomFieldType,
  ItemColumnDataType,
  TemplateSectionType
} from './metadata'
import type { DiscountType, NumberingConfig, QuotationStatus } from './quotation'

export type ChargeRuleType = 'percentage' | 'fixed'

export type CompanyProfile = {
  id: number
  name: string
  logoPath: string | null
  address: string | null
  phone: string | null
  email: string | null
  website: string | null
  taxRegNumber: string | null
  panNumber: string | null
  bankDetails: string | null
  authorizedSignatory: string | null
  signaturePath: string | null
  footer: string | null
  updatedAt: string
}

export type CompanyProfileInput = {
  name: string
  logoPath?: string | null
  address?: string | null
  phone?: string | null
  email?: string | null
  website?: string | null
  taxRegNumber?: string | null
  panNumber?: string | null
  bankDetails?: string | null
  authorizedSignatory?: string | null
  signaturePath?: string | null
  footer?: string | null
}

export type Customer = {
  id: number
  name: string
  companyName: string | null
  contactPerson: string | null
  address: string | null
  phone: string | null
  email: string | null
  taxNumber: string | null
  billingAddress: string | null
  shippingAddress: string | null
  createdAt: string
  updatedAt: string
}

export type CustomerInput = {
  name: string
  companyName?: string | null
  contactPerson?: string | null
  address?: string | null
  phone?: string | null
  email?: string | null
  taxNumber?: string | null
  billingAddress?: string | null
  shippingAddress?: string | null
}

export type Product = {
  id: number
  itemCode: string
  name: string
  description: string | null
  unit: string | null
  imagePath: string | null
  standardPrice: number
  taxPercent: number
  category: string | null
  hsnSac: string | null
  createdAt: string
  updatedAt: string
}

export type ProductInput = {
  itemCode: string
  name: string
  description?: string | null
  unit?: string | null
  imagePath?: string | null
  standardPrice: number
  taxPercent: number
  category?: string | null
  hsnSac?: string | null
}

export type TermsTemplate = {
  id: number
  title: string
  body: string
  displayOrder: number
  createdAt: string
  updatedAt: string
}

export type TermsTemplateInput = {
  title: string
  body: string
}

export type ChargeRule = {
  id: number
  name: string
  type: ChargeRuleType
  value: number
  appliesToSubtotal: boolean
  createdAt: string
  updatedAt: string
}

export type ChargeRuleInput = {
  name: string
  type: ChargeRuleType
  value: number
  appliesToSubtotal: boolean
}

export type AssetKind = 'logo' | 'signature' | 'product'
export type ReorderDirection = 'up' | 'down'

export type QuotationTemplate = {
  id: number
  name: string
  description: string | null
  isDefault: boolean
  createdAt: string
}

export type QuotationTemplateInput = {
  name: string
  description?: string | null
  isDefault?: boolean
}

export type TemplateSection = {
  id: number
  templateId: number
  name: string
  type: TemplateSectionType
  displayOrder: number
  enabled: boolean
}

export type TemplateSectionInput = {
  templateId: number
  name: string
  type: TemplateSectionType
  enabled?: boolean
}

export type CustomFieldOption = {
  id: number
  fieldDefinitionId: number
  label: string
  value: string
  displayOrder: number
}

export type CustomFieldOptionInput = {
  label: string
  value: string
}

export type CustomFieldDefinition = {
  id: number
  templateId: number
  sectionId: number
  fieldKey: string
  label: string
  type: CustomFieldType
  required: boolean
  defaultValue: string | null
  displayOrder: number
  printVisible: boolean
  readOnly: boolean
  config: string | null
}

export type CustomFieldDefinitionInput = {
  templateId: number
  sectionId: number
  fieldKey: string
  label: string
  type: CustomFieldType
  required?: boolean
  defaultValue?: string | null
  printVisible?: boolean
  readOnly?: boolean
  config?: string | null
  options?: CustomFieldOptionInput[]
}

export type CustomFieldDefinitionWithOptions = CustomFieldDefinition & {
  options: CustomFieldOption[]
}

export type ItemColumnDefinition = {
  id: number
  templateId: number
  label: string
  columnKey: string
  dataType: ItemColumnDataType
  displayOrder: number
  width: number | null
  required: boolean
  visible: boolean
  printInclude: boolean
  participatesInCalc: boolean
}

export type ItemColumnDefinitionInput = {
  templateId: number
  label: string
  columnKey: string
  dataType: ItemColumnDataType
  width?: number | null
  required?: boolean
  visible?: boolean
  printInclude?: boolean
  participatesInCalc?: boolean
}

export type TemplateSectionWithFields = TemplateSection & {
  fields: CustomFieldDefinitionWithOptions[]
}

export type QuotationTemplateBundle = QuotationTemplate & {
  sections: TemplateSectionWithFields[]
  itemColumns: ItemColumnDefinition[]
}

export type QuotationCustomValue = {
  id: number
  quotationId: number
  fieldDefinitionId: number
  value: string | null
}

export type QuotationCustomValueInput = {
  fieldDefinitionId: number
  value: string | null
}

export type QuotationItem = {
  id: number
  quotationId: number
  displayOrder: number
  productId: number | null
  qty: number
  rate: number
  discount: number
  discountType: DiscountType
  taxPercent: number
  amount: number
  columnValues: Record<string, unknown>
}

export type QuotationItemInput = {
  productId?: number | null
  qty: number
  rate: number
  discount?: number
  discountType?: DiscountType
  taxPercent?: number
  columnValues?: Record<string, unknown>
}

export type QuotationCharge = {
  id: number
  quotationId: number
  name: string
  type: 'percentage' | 'fixed'
  value: number
  appliesToSubtotal: boolean
  amount: number
}

export type QuotationChargeInput = {
  name: string
  type: 'percentage' | 'fixed'
  value: number
  appliesToSubtotal?: boolean
}

export type Quotation = {
  id: number
  quotationNumber: string
  date: string
  customerId: number
  templateId: number
  status: QuotationStatus
  currency: string
  subtotal: number
  discountTotal: number
  taxTotal: number
  grandTotal: number
  notesInternal: string | null
  notesCustomer: string | null
  parentQuotationId: number | null
  revisionNumber: number
  createdBy: string | null
  createdAt: string
  updatedAt: string
}

export type QuotationListItem = Quotation & {
  customerName: string | null
  templateName: string | null
}

export type QuotationInput = {
  date: string
  customerId: number
  templateId: number
  status?: QuotationStatus
  currency?: string
  discountTotal?: number
  notesInternal?: string | null
  notesCustomer?: string | null
  customValues?: QuotationCustomValueInput[]
  items?: QuotationItemInput[]
  charges?: QuotationChargeInput[]
}

export type QuotationBundle = Quotation & {
  customerName: string | null
  templateName: string | null
  customValues: QuotationCustomValue[]
  items: QuotationItem[]
  charges: QuotationCharge[]
}

export type { NumberingConfig, QuotationStatus, DiscountType }
