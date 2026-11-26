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

/** Quote types from the INFO sheet — the initial choice on a new quotation. */
export const QUOTE_TYPES = ['Tendam', 'Basket'] as const

export type QuoteType = (typeof QUOTE_TYPES)[number]

/** Material type → allowed finish subtypes (INFO sheet). */
export const MATERIAL_FINISHES: Record<string, string[]> = {
  'BWP Ply': ['Laminate', 'Back Painted Acrylic', 'Back Painted Glass', 'Acrymica', 'Ceramic'],
  HDFHMR: ['Back Painted Glass', 'PU Plain', 'PU Designer Shutter', 'PVC Plain', 'PVC Designer Shutter']
}

/** Front-finish shutter rate per Sq.Ft (PRICE LIST sheet). */
export const FINISH_RATES: Record<string, number> = {
  Laminate: 950,
  'Back Painted Acrylic': 1850,
  'Back Painted Glass': 2850,
  Acrymica: 1950,
  Ceramic: 4150,
  'PU Plain': 3250,
  'PU Designer Shutter': 3850,
  'PVC Plain': 2150,
  'PVC Designer Shutter': 2450
}

/** Drawer brand → [tendem drawer set, pot & pan set] price (PRICE LIST sheet). */
export const DRAWER_SET_RATES: Record<string, [number, number]> = {
  Hettich: [14500, 16500],
  Blum: [15500, 17500],
  Sleek: [8530, 10530],
  Ebco: [8530, 10530]
}

/** Handle option → rate + unit (PRICE LIST sheet). */
export const HANDLE_RATES: Record<string, { rate: number; unit: string }> = {
  'J Handle': { rate: 60, unit: 'Inch' },
  'G Handle': { rate: 60, unit: 'Inch' },
  Knob: { rate: 450, unit: 'Nos' },
  'Regular Handle': { rate: 180, unit: 'Nos' },
  Gola: { rate: 4500, unit: 'Inch' }
}

/** Handle option → bundled image filename (only options with provided images). */
export const HANDLE_IMAGES: Record<string, string> = {
  'J Handle': 'jg-handle.jpeg',
  'G Handle': 'jg-handle.jpeg'
}

/** Pantry subtype → bundled image filename. */
export const PANTRY_IMAGES: Record<string, string> = {
  'Glass Pantry': 'pantry-system.jpeg',
  'Metal Pantry': 'pantry-system.jpeg',
  'S.S Pantry': 'pantry-system.jpeg',
  'Drawer Pantry': 'drawer-pantry.jpeg',
  'Space Pantry': 'space-pantry.jpeg'
}

/** Top Edge Square subtypes → rate, unit, and image. */
export const TOP_EDGE_OPTIONS: Record<string, { rate: number; unit: string; image: string }> = {
  Square: { rate: 1850, unit: 'Nos', image: 'top-edge-square.jpg' },
  Curve: { rate: 1850, unit: 'Nos', image: 'top-edge-curve.jpg' },
  Gola: { rate: 4500, unit: 'Inch', image: 'top-edge-curve.jpg' }
}

/** Subtype dropdown groups — only products mapped below get a dropdown (INFO sheet). */
export const PRODUCT_SUBTYPES: Record<string, string[]> = {
  drawer: ['Hettich', 'Blum', 'Hafele', 'Sleek', 'Ebco', 'Power Slide'],
  cutlery: ['PVC', 'Wooden', 'Acrylic', 'S.S'],
  wicker: ['Wooden', 'PVC'],
  pantry: ['Glass Pantry', 'Metal Pantry', 'S.S Pantry', 'Drawer Pantry', 'Space Pantry'],
  rolling: ['Glass', 'PVC', 'Acrylic', 'Wooden'],
  corner: ['Magic Corner', 'Swing Tray', 'Space Corner'],
  handle: ['J Handle', 'G Handle', 'Knob', 'Regular Handle', 'Gola'],
  topedge: ['Square', 'Curve', 'Gola']
}

export type KitchenCatalogItem = {
  itemCode: string
  name: string
  group: 'shutter' | 'cabinet' | 'drawer' | 'basket'
  unit: string
  rate: number
  /** Default qty used when pre-filling a new kitchen quotation (from the sheet). */
  defaultQty: number
  /** Image filename bundled under resources/kitchen (installed to assets/products/kitchen). */
  image: string
  /** Key into PRODUCT_SUBTYPES when the product has a subtype dropdown. */
  subtypeGroup?: keyof typeof PRODUCT_SUBTYPES & string
}

const SHUTTER_ROWS: KitchenCatalogItem[] = [
  { itemCode: 'SHT-KP', name: 'Kitchen Platform Shutter Area', group: 'shutter', unit: 'Sq.Ft.', rate: 950, defaultQty: 34.8, image: 'shutter.jpeg' },
  { itemCode: 'SHT-OH', name: 'Overhead Unit Shutter Area', group: 'shutter', unit: 'Sq.Ft.', rate: 950, defaultQty: 33.5, image: 'shutter.jpeg' },
  { itemCode: 'SHT-PN', name: 'Pantry Unit Shutter Area', group: 'shutter', unit: 'Sq.Ft.', rate: 950, defaultQty: 0, image: 'shutter.jpeg' },
  { itemCode: 'SHT-VT', name: 'Vertical Unit Shutter Area', group: 'shutter', unit: 'Sq.Ft.', rate: 950, defaultQty: 0, image: 'shutter.jpeg' },
  { itemCode: 'SHT-CR', name: 'Crockery Unit Shutter Area', group: 'shutter', unit: 'Sq.Ft.', rate: 950, defaultQty: 0, image: 'shutter.jpeg' },
  { itemCode: 'SHT-AP', name: 'Appliances Unit Shutter Area', group: 'shutter', unit: 'Sq.Ft.', rate: 950, defaultQty: 0, image: 'shutter.jpeg' },
  { itemCode: 'SHT-LF', name: 'Loft Unit Shutter Area', group: 'shutter', unit: 'Sq.Ft.', rate: 950, defaultQty: 0, image: 'shutter.jpeg' }
]

/** Corner Unit is one line item. The three fittings are its subtype dropdown. */
export const COMMON_UNIT_ITEM_CODE = 'TD-COMMON'
export const CORNER_UNIT_NAME = 'Corner Unit'
export const COMMON_UNIT_OPTIONS: Record<string, { rate: number; unit: string; image: string }> = {
  'Magic Corner': { rate: 29500, unit: 'Nos', image: 'magic-corner.jpeg' },
  'Swing Tray': { rate: 29500, unit: 'Nos', image: 'swing-tray.jpeg' },
  'Space Corner': { rate: 29500, unit: 'Nos', image: 'space-pantry.jpeg' }
}

const COMMON_UNIT_CODES = new Set(['TD-COMMON', 'TD-MAGIC', 'TD-SWING', 'TD-SPACE'])

/** Installation is shutter square feet × this rate. The amount stays editable. */
export const INSTALLATION_RATE_PER_SQFT = 95
export const INSTALLATION_CHARGE_NAME = 'Installation charges'

/** Cabinet rate 1650 / open cabinet 2850 per the PRICE LIST sheet. */
const CABINET_ROWS: KitchenCatalogItem[] = [
  { itemCode: 'CAB-OH', name: 'Overhead Unit Cabinet Area', group: 'cabinet', unit: 'Sq.Ft.', rate: 1650, defaultQty: 33.5, image: 'cabinet.jpeg' },
  { itemCode: 'CAB-PN', name: 'Pantry Unit Cabinet Area (450MM)', group: 'cabinet', unit: 'Sq.Ft.', rate: 1650, defaultQty: 0, image: 'cabinet.jpeg' },
  { itemCode: 'CAB-VT', name: 'Vertical Unit Cabinet Area', group: 'cabinet', unit: 'Sq.Ft.', rate: 1650, defaultQty: 0, image: 'cabinet.jpeg' },
  { itemCode: 'CAB-CR', name: 'Crockery Unit Cabinet Area', group: 'cabinet', unit: 'Sq.Ft.', rate: 1650, defaultQty: 0, image: 'cabinet.jpeg' },
  { itemCode: 'CAB-RL', name: 'Rolling Cabinet Area', group: 'cabinet', unit: 'Sq.Ft.', rate: 1650, defaultQty: 0, image: 'cabinet.jpeg' },
  { itemCode: 'CAB-RK', name: 'Rack Unit Cabinet Area', group: 'cabinet', unit: 'Sq.Ft.', rate: 1650, defaultQty: 0, image: 'cabinet.jpeg' },
  { itemCode: 'CAB-LF', name: 'Loft Unit Cabinet Area', group: 'cabinet', unit: 'Sq.Ft.', rate: 1650, defaultQty: 0, image: 'cabinet.jpeg' },
  { itemCode: 'CAB-OPEN', name: 'Open Unit Area', group: 'cabinet', unit: 'R.Ft.', rate: 2850, defaultQty: 0, image: 'cabinet.jpeg' }
]

/**
 * TENDAM quote catalog in the exact sheet order:
 * 7 shutter rows, 8 cabinet rows, 18 drawer/accessory rows.
 * Rates follow the PRICE LIST sheet; Tendem drawer rates default to Hettich.
 */
export const KITCHEN_CATALOG: KitchenCatalogItem[] = [
  ...SHUTTER_ROWS,
  ...CABINET_ROWS,
  { itemCode: 'TD-ORGA', name: 'OrgaTray Cutlery Tray', group: 'drawer', unit: 'Nos', rate: 2800, defaultQty: 1, image: 'cutlery-tray.jpeg', subtypeGroup: 'cutlery' },
  { itemCode: 'TD-INLET', name: 'OrgaTech Inlet (Thali Inlet) (C/S Inlet)', group: 'drawer', unit: 'Nos', rate: 3850, defaultQty: 1, image: 'thali-inlet.jpeg' },
  { itemCode: 'TD-DRAWER', name: 'Tendem Drawer', group: 'drawer', unit: 'Nos', rate: 14500, defaultQty: 1, image: 'tendem-drawer.jpeg', subtypeGroup: 'drawer' },
  { itemCode: 'TD-POT', name: 'Pot and Pan Tendem Drawer', group: 'drawer', unit: 'Nos', rate: 16500, defaultQty: 5, image: 'pot-pan-drawer.jpeg', subtypeGroup: 'drawer' },
  { itemCode: 'TD-BOTTLE', name: 'Bottle Pull Out', group: 'drawer', unit: 'Nos', rate: 8630, defaultQty: 1, image: 'bottle-pullout.jpeg' },
  { itemCode: 'TD-WICKER', name: 'Wicker Basket', group: 'drawer', unit: 'Nos', rate: 8550, defaultQty: 0, image: 'wicker-basket.jpeg', subtypeGroup: 'wicker' },
  { itemCode: 'TD-PIPE', name: 'SS Pipe Frame', group: 'drawer', unit: 'R.Ft.', rate: 1350, defaultQty: 7.5, image: 'ss-pipe-frame.jpeg' },
  { itemCode: 'TD-CARCASE', name: 'Carcase', group: 'drawer', unit: 'R.Ft.', rate: 4250, defaultQty: 0, image: 'carcase.jpeg' },
  { itemCode: 'TD-MAT', name: 'Antiskid Waterproof Matt', group: 'drawer', unit: 'Sq.Ft.', rate: 55, defaultQty: 35, image: 'antiskid-matt.jpeg' },
  { itemCode: 'TD-JG', name: 'Handle', group: 'drawer', unit: 'Inch', rate: 60, defaultQty: 290, image: 'jg-handle.jpeg', subtypeGroup: 'handle' },
  { itemCode: 'TD-TOPAGE', name: 'Top Edge Square', group: 'drawer', unit: 'Nos', rate: 1850, defaultQty: 0, image: 'top-edge-square.jpg', subtypeGroup: 'topedge' },
  { itemCode: 'TD-HINGE', name: 'Soft Close Hinges', group: 'drawer', unit: 'Pair', rate: 650, defaultQty: 20, image: 'hinges.jpeg' },
  { itemCode: 'TD-PANTRY', name: 'Pantry System (600MM)', group: 'drawer', unit: 'Nos', rate: 29500, defaultQty: 0, image: 'pantry-system.jpeg', subtypeGroup: 'pantry' },
  { itemCode: 'TD-BIFOLD', name: 'Bi-Fold System', group: 'drawer', unit: 'Nos', rate: 14500, defaultQty: 0, image: 'bifold-system.jpeg' },
  { itemCode: 'TD-ROLL', name: 'Rolling Shutter', group: 'drawer', unit: 'Nos', rate: 29500, defaultQty: 0, image: 'rolling-shutter.jpeg', subtypeGroup: 'rolling' },
  { itemCode: 'TD-DUSTBIN', name: 'Wet And Dry Dustbin', group: 'drawer', unit: 'Nos', rate: 4500, defaultQty: 0, image: 'dustbin.jpeg' },
  { itemCode: 'TD-COMMON', name: 'Corner Unit', group: 'drawer', unit: 'Nos', rate: 29500, defaultQty: 0, image: 'magic-corner.jpeg', subtypeGroup: 'corner' }
]

/**
 * BASKET quote catalog (BASKET QUOTE sheet): same shutters/cabinets but with
 * the SILEX-made S.S. basket (202 grade) section instead of Tendem drawers.
 */
export const BASKET_CATALOG: KitchenCatalogItem[] = [
  ...SHUTTER_ROWS.map((row) =>
    row.itemCode === 'SHT-KP'
      ? { ...row, defaultQty: 35.3 }
      : row.itemCode === 'SHT-LF'
        ? { ...row, defaultQty: 35.1 }
        : row
  ),
  ...CABINET_ROWS.map((row) => (row.itemCode === 'CAB-LF' ? { ...row, defaultQty: 35.1 } : row)),
  { itemCode: 'SSB-CUTLERY', name: '100 mm (ht) Perforated Cutlery Basket with Standard Design', group: 'basket', unit: 'Nos', rate: 3600, defaultQty: 1, image: 'ss-cutlery-basket.jpeg' },
  { itemCode: 'SSB-CUP', name: '100 mm (ht) Cup & Saucer Basket', group: 'basket', unit: 'Nos', rate: 2490, defaultQty: 1, image: 'ss-cup-saucer.jpeg' },
  { itemCode: 'SSB-THALI', name: '200 mm (ht) Thali Basket', group: 'basket', unit: 'Nos', rate: 2560, defaultQty: 1, image: 'ss-thali-basket.jpeg' },
  { itemCode: 'SSB-MULTI200', name: '200 mm (ht) Multi Purpose Basket', group: 'basket', unit: 'Nos', rate: 2250, defaultQty: 2, image: 'ss-multi-200.jpeg' },
  { itemCode: 'SSB-MULTI150', name: '150 mm (ht) Multi Purpose Basket', group: 'basket', unit: 'Nos', rate: 2150, defaultQty: 3, image: 'ss-multi-150.jpeg' },
  { itemCode: 'SSB-SHELF', name: 'Shelf Pull Out Basket (8" × 24" × 21")', group: 'basket', unit: 'Nos', rate: 2170, defaultQty: 1, image: 'ss-shelf-pullout.jpeg' },
  { itemCode: 'SSB-CARRIER', name: '20 mm L Angle Carrier for Drawer', group: 'basket', unit: 'Nos', rate: 850, defaultQty: 8, image: 'ss-l-carrier.jpeg' },
  { itemCode: 'TD-WICKER', name: 'Wicker Basket', group: 'basket', unit: 'Nos', rate: 8550, defaultQty: 0, image: 'wicker-basket.jpeg', subtypeGroup: 'wicker' },
  { itemCode: 'TD-PIPE', name: 'SS Pipe Frame', group: 'basket', unit: 'R.Ft.', rate: 1350, defaultQty: 7.5, image: 'ss-pipe-frame.jpeg' },
  { itemCode: 'TD-CARCASE', name: 'Carcase', group: 'basket', unit: 'R.Ft.', rate: 4250, defaultQty: 0, image: 'carcase.jpeg' },
  { itemCode: 'SSB-TELE', name: 'Telescopic Channel', group: 'basket', unit: 'Pair', rate: 850, defaultQty: 0, image: 'telescopic-channel.png' },
  { itemCode: 'SSB-QUADRO', name: 'Quadro Soft Close Channel', group: 'basket', unit: 'Pair', rate: 3850, defaultQty: 8, image: 'quadro-channel.jpeg' },
  { itemCode: 'TD-JG', name: 'Handle', group: 'basket', unit: 'Inch', rate: 60, defaultQty: 290, image: 'jg-handle.jpeg', subtypeGroup: 'handle' },
  { itemCode: 'TD-TOPAGE', name: 'Top Edge Square', group: 'basket', unit: 'Nos', rate: 1850, defaultQty: 0, image: 'top-edge-square.jpg', subtypeGroup: 'topedge' },
  { itemCode: 'TD-HINGE', name: 'Soft Close Hinges', group: 'basket', unit: 'Pair', rate: 650, defaultQty: 11, image: 'hinges.jpeg' },
  { itemCode: 'TD-PANTRY', name: 'Pantry Unit System (450MM)', group: 'basket', unit: 'Nos', rate: 29500, defaultQty: 0, image: 'pantry-system.jpeg', subtypeGroup: 'pantry' },
  { itemCode: 'TD-ROLL', name: 'Rolling Shutter', group: 'basket', unit: 'Nos', rate: 29500, defaultQty: 0, image: 'rolling-shutter.jpeg', subtypeGroup: 'rolling' },
  { itemCode: 'TD-DUSTBIN', name: 'Wet And Dry Dustbin', group: 'basket', unit: 'Nos', rate: 4500, defaultQty: 0, image: 'dustbin.jpeg' },
  { itemCode: 'TD-COMMON', name: 'Corner Unit', group: 'basket', unit: 'Nos', rate: 29500, defaultQty: 0, image: 'magic-corner.jpeg', subtypeGroup: 'corner' }
]

/** Catalog for a quote type. */
export function catalogForQuoteType(quoteType: string): KitchenCatalogItem[] {
  return quoteType === 'Basket' ? BASKET_CATALOG : KITCHEN_CATALOG
}

/** Default document discount percentage per quote type (from the sheets). */
export const QUOTE_TYPE_DISCOUNT_PERCENT: Record<string, number> = {
  Tendam: 25,
  Basket: 10
}

/** Subtype pre-selected when a catalog row is added to a new quotation. */
export function defaultCatalogSubtype(item: KitchenCatalogItem): string {
  const options = item.subtypeGroup ? PRODUCT_SUBTYPES[item.subtypeGroup] : undefined
  if (!options || options.length === 0) return ''
  if (item.itemCode === 'TD-JG') return 'J Handle'
  if (item.itemCode === 'TD-TOPAGE') return 'Square'
  if (item.itemCode === 'TD-COMMON') return 'Magic Corner'
  return options.includes(item.name) ? item.name : options[0]
}

/** itemCode → subtype dropdown options (for the quotation editor). */
export const KITCHEN_SUBTYPES_BY_CODE: Record<string, string[]> = Object.fromEntries(
  [...KITCHEN_CATALOG, ...BASKET_CATALOG]
    .filter((item) => item.subtypeGroup)
    .map((item) => [item.itemCode, PRODUCT_SUBTYPES[item.subtypeGroup as string]])
)

/** itemCode → subtype group key (for price-list driven rate updates). */
export const KITCHEN_SUBTYPE_GROUP_BY_CODE: Record<string, string> = Object.fromEntries(
  [...KITCHEN_CATALOG, ...BASKET_CATALOG]
    .filter((item) => item.subtypeGroup)
    .map((item) => [item.itemCode, item.subtypeGroup as string])
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
  if (group === 'basket') {
    return 'SILEX MADE S.S. BASKET (202 GRADE)'
  }
  return 'TENDEM DRAWERS'
}

export function isInstallationChargeName(name: string): boolean {
  return /^installation\b/i.test(name.trim())
}

/** Shutter areas measured in square feet (1st category). Cabinets and accessories are excluded. */
export function isPlySquareFootLine(
  itemCode: string | undefined,
  unit: string,
  category: string
): boolean {
  if (!/sq\.?\s*ft/i.test(unit)) return false
  if (itemCode) return /^SHT-/.test(itemCode)
  if (/ROLLING/i.test(category)) return false
  return /SHUTTER/i.test(category)
}

export function plySquareFeet(
  lines: Array<{ itemCode?: string; qty: number; unit: string; category: string }>
): number {
  const total = lines.reduce((sum, line) => {
    if (!isPlySquareFootLine(line.itemCode, line.unit, line.category)) return sum
    const qty = Number.isFinite(line.qty) ? Math.max(0, line.qty) : 0
    return sum + qty
  }, 0)
  return Math.round(total * 1000) / 1000
}

export function isQuotationNoteField(fieldKey: string, label: string): boolean {
  return /note/i.test(fieldKey) || /^notes?$/i.test(label.trim())
}

export function isCommonUnitLine(code: string | undefined, description: string, category: string): boolean {
  if (code && COMMON_UNIT_CODES.has(code)) return true
  const categoryUpper = category.trim().toUpperCase()
  if (categoryUpper === 'COMMON UNIT' || categoryUpper === 'CORNER UNIT') return true
  const descriptionLower = description.trim().toLowerCase()
  return descriptionLower === 'common unit' || descriptionLower === 'corner unit'
}

export function commonUnitSubtype(description: string, subtype: string): string {
  const options = Object.keys(COMMON_UNIT_OPTIONS)
  if (options.includes(subtype)) return subtype
  if (options.includes(description)) return description
  return 'Magic Corner'
}

export function normalizeCategoryHeading(category: string): string {
  return category.replace(/^SLEEK\s+/i, '')
}

type FoldableItem = {
  productId?: number | null
  qty: number
  columnValues?: Record<string, unknown> | null
}

function foldText(values: Record<string, unknown> | null | undefined, key: string): string {
  const raw = values?.[key]
  return typeof raw === 'string' ? raw : ''
}

/**
 * Collapse Magic Corner / Swing Tray / Space Corner into one Corner Unit row
 * with a subtype, and drop the "SLEEK" prefix from drawer headings.
 * Returns the same array when nothing needs to change.
 */
export function foldCommonUnitItems<T extends FoldableItem>(
  items: T[],
  codeFor: (item: T) => string | undefined,
  commonProductId?: number | null
): T[] {
  const indexes: number[] = []
  items.forEach((item, index) => {
    if (isCommonUnitLine(codeFor(item), foldText(item.columnValues, 'description'), foldText(item.columnValues, 'category'))) {
      indexes.push(index)
    }
  })
  const needsHeadingFix = items.some((item) => /^SLEEK\s+/i.test(foldText(item.columnValues, 'category')))
  if (indexes.length === 0 && !needsHeadingFix) return items

  let heading = 'TENDEM DRAWERS'
  for (let index = 0; index < items.length; index += 1) {
    if (indexes.includes(index)) continue
    const category = normalizeCategoryHeading(foldText(items[index].columnValues, 'category'))
    if (/BASKET|TENDEM/i.test(category)) {
      heading = category
      break
    }
  }

  let bestIndex = indexes[0] ?? -1
  let bestQty = -1
  for (const index of indexes) {
    const qty = Number(items[index]?.qty) || 0
    if (qty > bestQty) {
      bestQty = qty
      bestIndex = index
    }
  }

  const alreadyCanonical =
    indexes.length === 1 &&
    !needsHeadingFix &&
    bestIndex >= 0 &&
    isCanonicalCommonUnit(items[bestIndex], commonProductId)

  if (alreadyCanonical) return items

  const source = bestIndex >= 0 ? items[bestIndex] : null
  const subtype = source
    ? commonUnitSubtype(foldText(source.columnValues, 'description'), foldText(source.columnValues, 'subtype'))
    : 'Magic Corner'
  const option = COMMON_UNIT_OPTIONS[subtype]
  const next: T[] = []
  let placed = false

  items.forEach((item, index) => {
    if (indexes.includes(index)) {
      if (!placed && source) {
        next.push({
          ...source,
          productId: commonProductId ?? source.productId,
          columnValues: {
            ...(source.columnValues ?? {}),
            description: CORNER_UNIT_NAME,
            subtype,
            category: heading,
            unit: option?.unit ?? (foldText(source.columnValues, 'unit') || 'Nos'),
            image: option ? `products/kitchen/${option.image}` : foldText(source.columnValues, 'image')
          }
        })
        placed = true
      }
      return
    }
    const category = foldText(item.columnValues, 'category')
    if (/^SLEEK\s+/i.test(category)) {
      next.push({
        ...item,
        columnValues: { ...(item.columnValues ?? {}), category: normalizeCategoryHeading(category) }
      })
      return
    }
    next.push(item)
  })

  return next
}

function isCanonicalCommonUnit(item: FoldableItem, commonProductId?: number | null): boolean {
  const description = foldText(item.columnValues, 'description')
  const subtype = foldText(item.columnValues, 'subtype')
  const category = foldText(item.columnValues, 'category')
  const option = COMMON_UNIT_OPTIONS[subtype]
  if (description !== CORNER_UNIT_NAME || !option) return false
  if (
    category.trim().toUpperCase() === 'COMMON UNIT' ||
    category.trim().toUpperCase() === 'CORNER UNIT' ||
    /^SLEEK\s+/i.test(category)
  ) {
    return false
  }
  if (commonProductId && item.productId !== commonProductId) return false
  const image = foldText(item.columnValues, 'image')
  return image.endsWith(option.image)
}

/**
 * Default software users (designer staff). Username is the first name in
 * lowercase, password follows the `<name>@12345` pattern, and each user gets
 * their own quote-number series (SKA0001, SKB0001, …).
 */
export const DEFAULT_USERS: Array<{
  username: string
  displayName: string
  quotePrefix: string
  isAdmin: boolean
}> = [
  { username: 'gayatri', displayName: 'Gayatri Gosavi', quotePrefix: 'SKA', isAdmin: false },
  { username: 'snehal', displayName: 'Snehal Jadhav', quotePrefix: 'SKB', isAdmin: false },
  { username: 'sakshi', displayName: 'Sakshi Pagar', quotePrefix: 'SKC', isAdmin: false },
  { username: 'darmesh', displayName: 'Darmesh Borse', quotePrefix: 'SKD', isAdmin: false },
  { username: 'sayali', displayName: 'Sayali Khairnar', quotePrefix: 'SKE', isAdmin: false },
  { username: 'admin', displayName: 'Admin', quotePrefix: 'SKF', isAdmin: true }
]

/** Default password for a seeded user: `<username>@12345`. */
export function defaultUserPassword(username: string): string {
  return `${username}@12345`
}

/** Per-user quote number, e.g. SKA0001. */
export function formatUserQuotationNumber(prefix: string, sequence: number): string {
  return `${prefix}${String(sequence).padStart(4, '0')}`
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
    fieldKey: 'projectName',
    label: 'Project',
    type: 'text',
    required: false,
    printVisible: true
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
  },
  {
    sectionType: 'custom',
    fieldKey: 'tableHeaders',
    label: 'Table Header Labels',
    type: 'text',
    required: false,
    printVisible: false
  }
]

/** Hidden per-quotation custom field that stores edited item-table header labels (JSON). */
export const TABLE_HEADERS_FIELD_KEY = 'tableHeaders'

/** Default item-table header labels, keyed by column (`srNo` + item column keys). */
export const DEFAULT_TABLE_HEADER_LABELS: Record<string, string> = {
  srNo: 'Sr.No.',
  image: 'Image',
  description: 'Description',
  qty: 'Qty',
  unit: 'Unit',
  rate: 'Rate',
  amount: 'Total'
}

/**
 * Parse the stored JSON of edited header labels. Blank labels are dropped unless
 * `keepBlank` is set (the editor keeps them while the user is mid-edit).
 */
export function parseTableHeaderOverrides(
  raw: unknown,
  keepBlank = false
): Record<string, string> {
  if (typeof raw !== 'string' || !raw.trim()) return {}
  try {
    const parsed: unknown = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') return {}
    const result: Record<string, string> = {}
    for (const [key, value] of Object.entries(parsed as Record<string, unknown>)) {
      if (typeof value !== 'string') continue
      if (keepBlank || value.trim()) result[key] = value
    }
    return result
  } catch {
    return {}
  }
}
