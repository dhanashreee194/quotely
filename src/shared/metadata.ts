/**
 * Hybrid rule: these keys are REAL columns on the quotation table (Phase 4).
 * They must never be stored as custom_field_definition / custom_field_value.
 */
export const RESERVED_QUOTATION_FIELD_KEYS = [
  'quotationNumber',
  'date',
  'customerId',
  'status',
  'grandTotal',
  'templateId'
] as const

export type ReservedQuotationFieldKey = (typeof RESERVED_QUOTATION_FIELD_KEYS)[number]

export function isReservedQuotationFieldKey(fieldKey: string): boolean {
  return (RESERVED_QUOTATION_FIELD_KEYS as readonly string[]).includes(fieldKey)
}

export const TEMPLATE_SECTION_TYPES = [
  'header',
  'customer',
  'reference',
  'items',
  'summary',
  'terms',
  'footer',
  'custom'
] as const

export type TemplateSectionType = (typeof TEMPLATE_SECTION_TYPES)[number]

export const CUSTOM_FIELD_TYPES = [
  'text',
  'textarea',
  'number',
  'currency',
  'percentage',
  'date',
  'dropdown',
  'checkbox',
  'radio',
  'auto',
  'calculated'
] as const

export type CustomFieldType = (typeof CUSTOM_FIELD_TYPES)[number]

export const ITEM_COLUMN_DATA_TYPES = ['text', 'number', 'currency', 'percentage'] as const

export type ItemColumnDataType = (typeof ITEM_COLUMN_DATA_TYPES)[number]

export const DEFAULT_SECTION_BLUEPRINT: Array<{
  name: string
  type: TemplateSectionType
  displayOrder: number
}> = [
  { name: 'Header', type: 'header', displayOrder: 0 },
  { name: 'Customer', type: 'customer', displayOrder: 1 },
  { name: 'Reference', type: 'reference', displayOrder: 2 },
  { name: 'Items', type: 'items', displayOrder: 3 },
  { name: 'Summary', type: 'summary', displayOrder: 4 },
  { name: 'Terms', type: 'terms', displayOrder: 5 },
  { name: 'Footer', type: 'footer', displayOrder: 6 }
]

export const DEFAULT_ITEM_COLUMNS: Array<{
  label: string
  columnKey: string
  dataType: ItemColumnDataType
  displayOrder: number
  width: number
  required: boolean
  participatesInCalc: boolean
}> = [
  {
    label: 'Description',
    columnKey: 'description',
    dataType: 'text',
    displayOrder: 0,
    width: 280,
    required: true,
    participatesInCalc: false
  },
  {
    label: 'Qty',
    columnKey: 'qty',
    dataType: 'number',
    displayOrder: 1,
    width: 80,
    required: true,
    participatesInCalc: true
  },
  {
    label: 'Unit',
    columnKey: 'unit',
    dataType: 'text',
    displayOrder: 2,
    width: 80,
    required: false,
    participatesInCalc: false
  },
  {
    label: 'Rate',
    columnKey: 'rate',
    dataType: 'currency',
    displayOrder: 3,
    width: 100,
    required: true,
    participatesInCalc: true
  },
  {
    label: 'Amount',
    columnKey: 'amount',
    dataType: 'currency',
    displayOrder: 4,
    width: 120,
    required: false,
    participatesInCalc: true
  }
]
