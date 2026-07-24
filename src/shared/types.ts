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

export type AssetKind = 'logo' | 'signature'
export type ReorderDirection = 'up' | 'down'
