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

export const ITEM_COLUMN_DATA_TYPES = ['text', 'number', 'currency', 'percentage', 'image'] as const

export type ItemColumnDataType = (typeof ITEM_COLUMN_DATA_TYPES)[number]

export const DEFAULT_SECTION_BLUEPRINT: Array<{
  name: string
  type: TemplateSectionType
  displayOrder: number
}> = [
  { name: 'Header', type: 'header', displayOrder: 0 },
  { name: 'Customer', type: 'customer', displayOrder: 1 },
  { name: 'Sales Representative', type: 'reference', displayOrder: 2 },
  { name: 'Quote Options', type: 'custom', displayOrder: 3 },
  { name: 'Items', type: 'items', displayOrder: 4 },
  { name: 'Summary', type: 'summary', displayOrder: 5 },
  { name: 'Terms', type: 'terms', displayOrder: 6 },
  { name: 'Footer', type: 'footer', displayOrder: 7 }
]

/**
 * Default line-item columns matching kitchen quote sheets
 * (Image · Description · Specs · Qty · Unit · Rate · Total).
 * Rate is editor-only by default; print matches Excel: Image|Description|Qty|Unit|Total.
 */
export const DEFAULT_ITEM_COLUMNS: Array<{
  label: string
  columnKey: string
  dataType: ItemColumnDataType
  displayOrder: number
  width: number
  required: boolean
  participatesInCalc: boolean
  printInclude: boolean
  visible: boolean
}> = [
  {
    label: 'Image',
    columnKey: 'image',
    dataType: 'image',
    displayOrder: 0,
    width: 72,
    required: false,
    participatesInCalc: false,
    printInclude: true,
    visible: true
  },
  {
    label: 'Description',
    columnKey: 'description',
    dataType: 'text',
    displayOrder: 1,
    width: 260,
    required: true,
    participatesInCalc: false,
    printInclude: true,
    visible: true
  },
  {
    label: 'Specs',
    columnKey: 'specs',
    dataType: 'text',
    displayOrder: 2,
    width: 140,
    required: false,
    participatesInCalc: false,
    printInclude: false,
    visible: true
  },
  {
    label: 'Qty',
    columnKey: 'qty',
    dataType: 'number',
    displayOrder: 3,
    width: 70,
    required: true,
    participatesInCalc: true,
    printInclude: true,
    visible: true
  },
  {
    label: 'Unit',
    columnKey: 'unit',
    dataType: 'text',
    displayOrder: 4,
    width: 70,
    required: false,
    participatesInCalc: false,
    printInclude: true,
    visible: true
  },
  {
    label: 'Rate',
    columnKey: 'rate',
    dataType: 'currency',
    displayOrder: 5,
    width: 90,
    required: true,
    participatesInCalc: true,
    printInclude: false,
    visible: true
  },
  {
    label: 'Total',
    columnKey: 'amount',
    dataType: 'currency',
    displayOrder: 6,
    width: 110,
    required: false,
    participatesInCalc: true,
    printInclude: true,
    visible: true
  }
]

/** Material type → allowed finish subtypes (from the material sub types sheet). */
export const MATERIAL_FINISHES: Record<string, string[]> = {
  'BWP Ply': ['Laminate', 'Back Painted Acrylic', 'Back Painted Glass', 'Acrymica', 'Ceramic'],
  HDFHMR: ['Back Painted Glass', 'PU Plain', 'PU Designer Shutter', 'PVC Plain', 'PVC Designer Shutter']
}

/** Subtype dropdown groups — only products mapped below get a dropdown. */
export const PRODUCT_SUBTYPES: Record<string, string[]> = {
  drawer: ['Hettich', 'Blum', 'Hafele', 'Sleek', 'Ebco', 'Power Slide'],
  cutlery: ['PVC', 'Wooden', 'Acrylic', 'S.S'],
  wicker: ['Wooden', 'PVC'],
  pantry: ['Glass Pantry', 'Metal Pantry', 'S.S Pantry', 'Drawer Pantry', 'Space Pantry'],
  rolling: ['Glass', 'PVC', 'Acrylic', 'Wooden'],
  corner: ['Magic Corner', 'Swing Tray', 'Space Corner']
}

export type KitchenCatalogItem = {
  itemCode: string
  name: string
  group: 'shutter' | 'cabinet' | 'drawer'
  unit: string
  rate: number
  /** Default qty used when pre-filling a new kitchen quotation (from the sheet). */
  defaultQty: number
  /** Image filename bundled under resources/kitchen (installed to assets/products/kitchen). */
  image: string
  /** Key into PRODUCT_SUBTYPES when the product has a subtype dropdown. */
  subtypeGroup?: keyof typeof PRODUCT_SUBTYPES & string
}

/**
 * Full kitchen catalog in the exact order of the "quotre format" sheet
 * (TENDAM quote): 7 shutter rows, 8 cabinet rows, 18 drawer/accessory rows.
 */
export const KITCHEN_CATALOG: KitchenCatalogItem[] = [
  { itemCode: 'SHT-KP', name: 'Kitchen Platform Shutter Area', group: 'shutter', unit: 'Sq.Ft.', rate: 950, defaultQty: 34.8, image: 'shutter.jpeg' },
  { itemCode: 'SHT-OH', name: 'Overhead Unit Shutter Area', group: 'shutter', unit: 'Sq.Ft.', rate: 950, defaultQty: 33.5, image: 'shutter.jpeg' },
  { itemCode: 'SHT-PN', name: 'Pantry Unit Shutter Area', group: 'shutter', unit: 'Sq.Ft.', rate: 950, defaultQty: 0, image: 'shutter.jpeg' },
  { itemCode: 'SHT-VT', name: 'Vertical Unit Shutter Area', group: 'shutter', unit: 'Sq.Ft.', rate: 950, defaultQty: 0, image: 'shutter.jpeg' },
  { itemCode: 'SHT-CR', name: 'Crockery Unit Shutter Area', group: 'shutter', unit: 'Sq.Ft.', rate: 950, defaultQty: 0, image: 'shutter.jpeg' },
  { itemCode: 'SHT-AP', name: 'Appliances Unit Shutter Area', group: 'shutter', unit: 'Sq.Ft.', rate: 950, defaultQty: 0, image: 'shutter.jpeg' },
  { itemCode: 'SHT-LF', name: 'Loft Unit Shutter Area', group: 'shutter', unit: 'Sq.Ft.', rate: 950, defaultQty: 0, image: 'shutter.jpeg' },
  { itemCode: 'CAB-OH', name: 'Overhead Unit Cabinet Area', group: 'cabinet', unit: 'Sq.Ft.', rate: 1450, defaultQty: 33.5, image: 'cabinet.jpeg' },
  { itemCode: 'CAB-PN', name: 'Pantry Unit Cabinet Area (450MM)', group: 'cabinet', unit: 'Sq.Ft.', rate: 1450, defaultQty: 0, image: 'cabinet.jpeg' },
  { itemCode: 'CAB-VT', name: 'Vertical Unit Cabinet Area', group: 'cabinet', unit: 'Sq.Ft.', rate: 1450, defaultQty: 0, image: 'cabinet.jpeg' },
  { itemCode: 'CAB-CR', name: 'Crockery Unit Cabinet Area', group: 'cabinet', unit: 'Sq.Ft.', rate: 1450, defaultQty: 0, image: 'cabinet.jpeg' },
  { itemCode: 'CAB-RL', name: 'Rolling Cabinet Area', group: 'cabinet', unit: 'Sq.Ft.', rate: 1450, defaultQty: 0, image: 'cabinet.jpeg' },
  { itemCode: 'CAB-RK', name: 'Rack Unit Cabinet Area', group: 'cabinet', unit: 'Sq.Ft.', rate: 1450, defaultQty: 0, image: 'cabinet.jpeg' },
  { itemCode: 'CAB-LF', name: 'Loft Unit Cabinet Area', group: 'cabinet', unit: 'Sq.Ft.', rate: 1450, defaultQty: 0, image: 'cabinet.jpeg' },
  { itemCode: 'CAB-OPEN', name: 'Open Unit Area', group: 'cabinet', unit: 'R.Ft.', rate: 1200, defaultQty: 0, image: 'cabinet.jpeg' },
  { itemCode: 'TD-ORGA', name: 'OrgaTray Cutlery Tray', group: 'drawer', unit: 'Nos', rate: 2800, defaultQty: 1, image: 'cutlery-tray.png', subtypeGroup: 'cutlery' },
  { itemCode: 'TD-INLET', name: 'OrgaTech Inlet (Thali Inlet) (C/S Inlet)', group: 'drawer', unit: 'Nos', rate: 3850, defaultQty: 1, image: 'thali-inlet.jpeg' },
  { itemCode: 'TD-DRAWER', name: 'Tendem Drawer', group: 'drawer', unit: 'Nos', rate: 9630, defaultQty: 1, image: 'tendem-drawer.jpeg', subtypeGroup: 'drawer' },
  { itemCode: 'TD-POT', name: 'Pot and Pan Tendem Drawer', group: 'drawer', unit: 'Nos', rate: 10630, defaultQty: 5, image: 'pot-pan-drawer.jpeg', subtypeGroup: 'drawer' },
  { itemCode: 'TD-BOTTLE', name: 'Bottle Pull Out', group: 'drawer', unit: 'Nos', rate: 8630, defaultQty: 1, image: 'bottle-pullout.jpeg' },
  { itemCode: 'TD-WICKER', name: 'Wicker Basket', group: 'drawer', unit: 'Nos', rate: 2500, defaultQty: 0, image: 'wicker-basket.jpeg', subtypeGroup: 'wicker' },
  { itemCode: 'TD-PIPE', name: 'SS Pipe Frame', group: 'drawer', unit: 'R.Ft.', rate: 1350, defaultQty: 7.5, image: 'ss-pipe-frame.jpeg' },
  { itemCode: 'TD-CARCASE', name: 'Carcase', group: 'drawer', unit: 'R.Ft.', rate: 1350, defaultQty: 0, image: 'carcase.jpeg' },
  { itemCode: 'TD-MAT', name: 'Antiskid Waterproof Matt', group: 'drawer', unit: 'Sq.Ft.', rate: 80, defaultQty: 35, image: 'antiskid-matt.jpeg' },
  { itemCode: 'TD-JG', name: 'J/G Handle', group: 'drawer', unit: 'Inch', rate: 50, defaultQty: 290, image: 'jg-handle.jpeg' },
  { itemCode: 'TD-TOPAGE', name: 'Top-age Handle', group: 'drawer', unit: 'Inch', rate: 60, defaultQty: 0, image: 'topage-handle.jpeg' },
  { itemCode: 'TD-HINGE', name: 'Soft Close Hinges', group: 'drawer', unit: 'Pair', rate: 650, defaultQty: 20, image: 'hinges.jpeg' },
  { itemCode: 'TD-PANTRY', name: 'Pantry System (600MM)', group: 'drawer', unit: 'Nos', rate: 25000, defaultQty: 0, image: 'pantry-system.jpeg', subtypeGroup: 'pantry' },
  { itemCode: 'TD-BIFOLD', name: 'Bi-Fold System', group: 'drawer', unit: 'Nos', rate: 12000, defaultQty: 0, image: 'bifold-system.jpeg' },
  { itemCode: 'TD-ROLL', name: 'Rolling Shutter', group: 'drawer', unit: 'Nos', rate: 15000, defaultQty: 0, image: 'rolling-shutter.jpeg', subtypeGroup: 'rolling' },
  { itemCode: 'TD-SWING', name: 'Swing Tray', group: 'drawer', unit: 'Nos', rate: 9500, defaultQty: 0, image: 'swing-tray.jpeg', subtypeGroup: 'corner' },
  { itemCode: 'TD-DUSTBIN', name: 'Wet And Dry Dustbin', group: 'drawer', unit: 'Nos', rate: 4500, defaultQty: 0, image: 'dustbin.jpeg' },
  { itemCode: 'TD-MAGIC', name: 'Magic Corner', group: 'drawer', unit: 'Nos', rate: 18500, defaultQty: 0, image: 'magic-corner.jpeg', subtypeGroup: 'corner' }
]

/** itemCode → subtype dropdown options (for the quotation editor). */
export const KITCHEN_SUBTYPES_BY_CODE: Record<string, string[]> = Object.fromEntries(
  KITCHEN_CATALOG.filter((item) => item.subtypeGroup).map((item) => [
    item.itemCode,
    PRODUCT_SUBTYPES[item.subtypeGroup as string]
  ])
)

/** Category (group) label shown in the quote table, renamed by material + finish. */
export function kitchenGroupLabel(
  group: string,
  baseMaterial?: string | null,
  finish?: string | null
): string {
  const materialToken =
    !baseMaterial || baseMaterial === 'BWP Ply' ? 'BWP MARINE PLY' : baseMaterial.toUpperCase()
  if (group === 'shutter') {
    return `${materialToken} ${(finish || 'Laminate').toUpperCase()} SHUTTER`
  }
  if (group === 'cabinet') {
    return `${materialToken} CABINET`
  }
  return 'SLEEK TENDEM DRAWERS'
}

/** Kitchen-trade custom fields aligned with FORMAT FOR QUOTE SOFTWARE.xlsx / UXPin. */
export const DEFAULT_CUSTOM_FIELDS: Array<{
  sectionType: TemplateSectionType
  fieldKey: string
  label: string
  type: CustomFieldType
  required: boolean
  printVisible: boolean
  defaultValue?: string
  options?: Array<{ label: string; value: string }>
}> = [
  {
    sectionType: 'reference',
    fieldKey: 'salesExecutive',
    label: 'Sales Executive Name',
    type: 'text',
    required: false,
    printVisible: true,
    defaultValue: ''
  },
  {
    sectionType: 'reference',
    fieldKey: 'designerName',
    label: 'Designer Name',
    type: 'text',
    required: false,
    printVisible: true
  },
  {
    sectionType: 'reference',
    fieldKey: 'designerContact',
    label: 'Contact No',
    type: 'text',
    required: false,
    printVisible: true
  },
  {
    sectionType: 'reference',
    fieldKey: 'designerEmail',
    label: 'Email',
    type: 'text',
    required: false,
    printVisible: true,
    defaultValue: 'sales@silexkitchen.com'
  },
  {
    sectionType: 'custom',
    fieldKey: 'quoteType',
    label: 'Quotation Type',
    type: 'dropdown',
    required: true,
    printVisible: true,
    defaultValue: 'Tendam',
    options: [
      { label: 'Tendam', value: 'Tendam' },
      { label: 'Basket', value: 'Basket' }
    ]
  },
  {
    sectionType: 'custom',
    fieldKey: 'baseMaterial',
    label: 'Base Material',
    type: 'dropdown',
    required: true,
    printVisible: true,
    defaultValue: 'BWP Ply',
    options: [
      { label: 'BWP Ply', value: 'BWP Ply' },
      { label: 'HDFHMR', value: 'HDFHMR' }
    ]
  },
  {
    sectionType: 'custom',
    fieldKey: 'finish',
    label: 'Finish',
    type: 'dropdown',
    required: true,
    printVisible: true,
    defaultValue: 'Laminate',
    options: [
      { label: 'Laminate', value: 'Laminate' },
      { label: 'Back Painted Acrylic', value: 'Back Painted Acrylic' },
      { label: 'Back Painted Glass', value: 'Back Painted Glass' },
      { label: 'Acrymica', value: 'Acrymica' },
      { label: 'Ceramic', value: 'Ceramic' },
      { label: 'PU Plain', value: 'PU Plain' },
      { label: 'PU Designer Shutter', value: 'PU Designer Shutter' },
      { label: 'PVC Plain', value: 'PVC Plain' },
      { label: 'PVC Designer Shutter', value: 'PVC Designer Shutter' }
    ]
  }
]
