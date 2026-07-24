import type {
  AssetKind,
  ChargeRule,
  ChargeRuleInput,
  CompanyProfile,
  CompanyProfileInput,
  Customer,
  CustomerInput,
  Product,
  ProductInput,
  ReorderDirection,
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

export type QuotelyApi = {
  settings: SettingsApi
  company: CompanyApi
  customers: CustomersApi
  products: ProductsApi
  termsTemplates: TermsTemplatesApi
  chargeRules: ChargeRulesApi
  assets: AssetsApi
}

export type * from './types'
