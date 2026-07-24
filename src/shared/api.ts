import type {
  AuditLogEntry,
  AuditLogFilters,
  BackupCreateResult,
  BackupRestoreResult,
  CsvExportKind,
  QuotationListFilters
} from './dataManagement'
import type { QuotationDocumentModel } from './document'
import type { NumberingConfig, QuotationStatus } from './quotation'
import type {
  AssetKind,
  ChargeRule,
  ChargeRuleInput,
  CompanyProfile,
  CompanyProfileInput,
  CustomFieldDefinitionInput,
  CustomFieldDefinitionWithOptions,
  Customer,
  CustomerInput,
  ItemColumnDefinition,
  ItemColumnDefinitionInput,
  Product,
  ProductInput,
  QuotationBundle,
  QuotationInput,
  QuotationListItem,
  QuotationTemplate,
  QuotationTemplateBundle,
  QuotationTemplateInput,
  ReorderDirection,
  TemplateSection,
  TemplateSectionInput,
  TermsTemplate,
  TermsTemplateInput
} from './types'

export type SettingsApi = {
  get: (key: string) => Promise<string | null>
  set: (key: string, value: string) => Promise<void>
}

export type CompanyApi = {
  get: () => Promise<CompanyProfile | null>
  upsert: (data: CompanyProfileInput) => Promise<CompanyProfile>
}

export type CustomersApi = {
  list: (search?: string) => Promise<Customer[]>
  get: (id: number) => Promise<Customer | null>
  create: (data: CustomerInput) => Promise<Customer>
  update: (id: number, data: CustomerInput) => Promise<Customer>
  remove: (id: number) => Promise<void>
}

export type ProductsApi = {
  list: (search?: string) => Promise<Product[]>
  get: (id: number) => Promise<Product | null>
  create: (data: ProductInput) => Promise<Product>
  update: (id: number, data: ProductInput) => Promise<Product>
  remove: (id: number) => Promise<void>
}

export type TermsTemplatesApi = {
  list: () => Promise<TermsTemplate[]>
  create: (data: TermsTemplateInput) => Promise<TermsTemplate>
  update: (id: number, data: TermsTemplateInput) => Promise<TermsTemplate>
  remove: (id: number) => Promise<void>
  reorder: (id: number, direction: ReorderDirection) => Promise<TermsTemplate[]>
}

export type ChargeRulesApi = {
  list: () => Promise<ChargeRule[]>
  create: (data: ChargeRuleInput) => Promise<ChargeRule>
  update: (id: number, data: ChargeRuleInput) => Promise<ChargeRule>
  remove: (id: number) => Promise<void>
}

export type AssetsApi = {
  pickImage: (kind: AssetKind) => Promise<string | null>
  getDataUrl: (relativePath: string) => Promise<string | null>
}

export type QuotationTemplatesApi = {
  list: () => Promise<QuotationTemplate[]>
  get: (id: number) => Promise<QuotationTemplateBundle | null>
  create: (data: QuotationTemplateInput) => Promise<QuotationTemplate>
  update: (id: number, data: QuotationTemplateInput) => Promise<QuotationTemplate>
  remove: (id: number) => Promise<void>
  setDefault: (id: number) => Promise<QuotationTemplate>
  sections: {
    create: (data: TemplateSectionInput) => Promise<TemplateSection>
    update: (
      id: number,
      data: Pick<TemplateSectionInput, 'name' | 'type' | 'enabled'>
    ) => Promise<TemplateSection>
    remove: (id: number) => Promise<void>
    reorder: (id: number, direction: ReorderDirection) => Promise<TemplateSection[]>
  }
  fields: {
    create: (data: CustomFieldDefinitionInput) => Promise<CustomFieldDefinitionWithOptions>
    update: (
      id: number,
      data: Omit<CustomFieldDefinitionInput, 'templateId' | 'sectionId'>
    ) => Promise<CustomFieldDefinitionWithOptions>
    remove: (id: number) => Promise<void>
    reorder: (
      id: number,
      direction: ReorderDirection
    ) => Promise<CustomFieldDefinitionWithOptions[]>
  }
  itemColumns: {
    create: (data: ItemColumnDefinitionInput) => Promise<ItemColumnDefinition>
    update: (
      id: number,
      data: Omit<ItemColumnDefinitionInput, 'templateId'>
    ) => Promise<ItemColumnDefinition>
    remove: (id: number) => Promise<void>
    reorder: (id: number, direction: ReorderDirection) => Promise<ItemColumnDefinition[]>
  }
}

export type QuotationsApi = {
  list: (filters?: QuotationListFilters | string) => Promise<QuotationListItem[]>
  get: (id: number) => Promise<QuotationBundle | null>
  create: (data: QuotationInput) => Promise<QuotationBundle>
  update: (id: number, data: QuotationInput) => Promise<QuotationBundle>
  remove: (id: number) => Promise<void>
  finalize: (id: number) => Promise<QuotationBundle>
  setStatus: (id: number, status: QuotationStatus) => Promise<QuotationBundle>
  duplicate: (id: number) => Promise<QuotationBundle>
  revise: (id: number) => Promise<QuotationBundle>
}

export type BackupApi = {
  create: () => Promise<BackupCreateResult | null>
  pick: () => Promise<string | null>
  restore: (zipPath: string) => Promise<BackupRestoreResult>
}

export type AuditApi = {
  list: (filters?: AuditLogFilters) => Promise<AuditLogEntry[]>
  actions: () => Promise<string[]>
}

export type ExportApi = {
  csv: (kind: CsvExportKind) => Promise<string | null>
}

export type NumberingApi = {
  get: () => Promise<NumberingConfig>
  update: (patch: Partial<NumberingConfig>) => Promise<NumberingConfig>
  peekNext: () => Promise<string>
}

export type DocumentsApi = {
  getModel: (quotationId: number) => Promise<QuotationDocumentModel | null>
  exportPdf: (quotationId: number) => Promise<string | null>
  print: (quotationId: number) => Promise<boolean>
  notifyReady: () => void
}

export type QuotelyApi = {
  settings: SettingsApi
  company: CompanyApi
  customers: CustomersApi
  products: ProductsApi
  termsTemplates: TermsTemplatesApi
  chargeRules: ChargeRulesApi
  assets: AssetsApi
  quotationTemplates: QuotationTemplatesApi
  quotations: QuotationsApi
  numbering: NumberingApi
  documents: DocumentsApi
  backup: BackupApi
  audit: AuditApi
  export: ExportApi
}

export type * from './types'
export type * from './metadata'
export type * from './quotation'
export type * from './document'
export type * from './dataManagement'
