import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Alert from '@mui/material/Alert'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import IconButton from '@mui/material/IconButton'
import MenuItem from '@mui/material/MenuItem'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import AddIcon from '@mui/icons-material/Add'
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined'
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf'
import PrintIcon from '@mui/icons-material/Print'
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined'
import { calculateQuotationTotals } from '../../../shared/calc'
import {
  DRAWER_SET_RATES,
  FINISH_RATES,
  HANDLE_IMAGES,
  HANDLE_RATES,
  KITCHEN_SUBTYPES_BY_CODE,
  KITCHEN_SUBTYPE_GROUP_BY_CODE,
  MATERIAL_FINISHES,
  QUOTE_TYPE_DISCOUNT_PERCENT,
  catalogForQuoteType,
  kitchenGroupLabel
} from '../../../shared/metadata'
import type {
  ChargeRule,
  CompanyProfile,
  Customer,
  CustomFieldDefinitionWithOptions,
  Product,
  QuotationBundle,
  QuotationChargeInput,
  QuotationItemInput,
  QuotationTemplate,
  QuotationTemplateBundle
} from '../../../shared/types'
import { buildDynamicDefaultValues } from '../lib/dynamicSchema'
import PageShell from '../layout/PageShell'
import { useAuthStore } from '../stores/authStore'
import './QuotationEditor.css'

type EditorItem = QuotationItemInput & { key: string }
type EditorCharge = QuotationChargeInput & { key: string }

const UNIT_OPTIONS = ['Nos', 'Sq.Ft.', 'R.Ft.', 'Inch', 'Pair', 'Set']

function today(): string {
  return new Date().toISOString().slice(0, 10)
}

function newKey(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

/** Small clickable image thumbnail used inside the document table. */
function ItemThumb({
  path,
  onChange
}: {
  path: string
  onChange: (path: string) => void
}): React.JSX.Element {
  const [preview, setPreview] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    if (!path) {
      setPreview(null)
      return
    }
    void window.api.assets.getDataUrl(path).then((url) => {
      if (!cancelled) setPreview(url)
    })
    return () => {
      cancelled = true
    }
  }, [path])

  return (
    <div
      className="qe-thumb"
      title={path ? 'Click to change image' : 'Click to add image'}
      onClick={() => {
        void window.api.assets.pickImage('product').then((relativePath) => {
          if (relativePath) onChange(relativePath)
        })
      }}
    >
      {preview ? <img src={preview} alt="" /> : <span>+</span>}
    </div>
  )
}

/** Category band label follows the selected material + finish (like the printed sheet). */
function displayCategory(category: string, baseMaterial: string, finish: string): string {
  if (/SHUTTER/i.test(category) && !/ROLLING/i.test(category)) {
    return kitchenGroupLabel('shutter', baseMaterial, finish)
  }
  if (/CABINET/i.test(category)) {
    return kitchenGroupLabel('cabinet', baseMaterial, finish)
  }
  return category
}

type NewProductDraft = {
  productId: number | ''
  description: string
  category: string
  qty: number
  unit: string
  rate: number
}

const EMPTY_PRODUCT_DRAFT: NewProductDraft = {
  productId: '',
  description: '',
  category: '',
  qty: 1,
  unit: 'Nos',
  rate: 0
}

type NewCustomerDraft = {
  name: string
  phone: string
  email: string
  address: string
}

const EMPTY_CUSTOMER_DRAFT: NewCustomerDraft = { name: '', phone: '', email: '', address: '' }

export default function QuotationEditorPage(): React.JSX.Element {
  const { id } = useParams()
  const navigate = useNavigate()
  const editingId = id && id !== 'new' ? Number(id) : null

  const [templates, setTemplates] = useState<QuotationTemplate[]>([])
  const [templateBundle, setTemplateBundle] = useState<QuotationTemplateBundle | null>(null)
  const [customers, setCustomers] = useState<Customer[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [chargeRules, setChargeRules] = useState<ChargeRule[]>([])
  const [existing, setExisting] = useState<QuotationBundle | null>(null)
  const [company, setCompany] = useState<CompanyProfile | null>(null)
  const [letterhead, setLetterhead] = useState<string | null>(null)

  const [templateId, setTemplateId] = useState<number | ''>('')
  const [customerId, setCustomerId] = useState<number | ''>('')
  const [date, setDate] = useState(today())
  const [currency, setCurrency] = useState('INR')
  const [discountTotal, setDiscountTotal] = useState(0)
  const [notesInternal, setNotesInternal] = useState('')
  const [notesCustomer, setNotesCustomer] = useState('')
  const [customFieldValues, setCustomFieldValues] = useState<Record<string, unknown>>({})
  const [items, setItems] = useState<EditorItem[]>([
    {
      key: newKey(),
      qty: 1,
      rate: 0,
      discount: 0,
      discountType: 'fixed',
      taxPercent: 0,
      columnValues: {}
    }
  ])
  const [charges, setCharges] = useState<EditorCharge[]>([])
  const [peekNumber, setPeekNumber] = useState('')
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [saving, setSaving] = useState(false)

  // Inline "new customer" form inside the Customer Details block.
  const [customerFormOpen, setCustomerFormOpen] = useState(false)
  const [customerDraft, setCustomerDraft] = useState<NewCustomerDraft>(EMPTY_CUSTOMER_DRAFT)
  const [customerSaving, setCustomerSaving] = useState(false)

  // "Add product" dialog.
  const [productDialogOpen, setProductDialogOpen] = useState(false)
  const [productDraft, setProductDraft] = useState<NewProductDraft>(EMPTY_PRODUCT_DRAFT)

  const loadMeta = useCallback(async (): Promise<void> => {
    const [templateRows, customerRows, productRows, rules, peek, companyRow, letterheadUrl] =
      await Promise.all([
        window.api.quotationTemplates.list(),
        window.api.customers.list(),
        window.api.products.list(),
        window.api.chargeRules.list(),
        window.api.numbering.peekNext(),
        window.api.company.get(),
        window.api.assets.getDataUrl('branding/letterhead.jpeg')
      ])
    setTemplates(templateRows)
    setCustomers(customerRows)
    setProducts(productRows)
    setChargeRules(rules)
    setPeekNumber(peek)
    setCompany(companyRow)
    setLetterhead(letterheadUrl)

    if (!editingId) {
      const preferred = templateRows.find((row) => row.isDefault) ?? templateRows[0]
      if (preferred) setTemplateId(preferred.id)
    }
  }, [editingId])

  useEffect(() => {
    void loadMeta().catch((err: unknown) =>
      setError(err instanceof Error ? err.message : 'Failed to load editor data')
    )
  }, [loadMeta])

  useEffect(() => {
    if (templateId === '') {
      setTemplateBundle(null)
      return
    }
    void window.api.quotationTemplates
      .get(templateId)
      .then((bundle) => {
        setTemplateBundle(bundle)
        if (!editingId && bundle && charges.length === 0 && chargeRules.length > 0) {
          setCharges(
            chargeRules.map((rule) => ({
              key: newKey(),
              name: rule.name,
              type: rule.type,
              value: rule.value,
              appliesToSubtotal: rule.appliesToSubtotal
            }))
          )
        }
      })
      .catch((err: unknown) =>
        setError(err instanceof Error ? err.message : 'Failed to load template')
      )
    // eslint-disable-next-line react-hooks/exhaustive-deps -- seed charges only when template changes on create
  }, [templateId, chargeRules, editingId])

  // Seed custom-field defaults (quotation type, material, finish, sales rep…) on new quotes.
  useEffect(() => {
    if (editingId != null || !templateBundle) return
    const fields = templateBundle.sections
      .filter((section) => section.enabled && section.type !== 'items')
      .flatMap((section) => section.fields)
    setCustomFieldValues((prev) => ({ ...buildDynamicDefaultValues(fields), ...prev }))
  }, [editingId, templateBundle])

  useEffect(() => {
    if (editingId == null) return
    void window.api.quotations
      .get(editingId)
      .then(async (bundle) => {
        if (!bundle) {
          setError('Quotation not found')
          return
        }
        setExisting(bundle)
        setTemplateId(bundle.templateId)
        setCustomerId(bundle.customerId)
        setDate(bundle.date.slice(0, 10))
        setCurrency(bundle.currency)
        setDiscountTotal(bundle.discountTotal)
        setNotesInternal(bundle.notesInternal ?? '')
        setNotesCustomer(bundle.notesCustomer ?? '')
        setItems(
          bundle.items.map((item) => ({
            key: newKey(),
            productId: item.productId,
            qty: item.qty,
            rate: item.rate,
            discount: item.discount,
            discountType: item.discountType,
            taxPercent: item.taxPercent,
            columnValues: item.columnValues
          }))
        )
        setCharges(
          bundle.charges.map((charge) => ({
            key: newKey(),
            name: charge.name,
            type: charge.type,
            value: charge.value,
            appliesToSubtotal: charge.appliesToSubtotal
          }))
        )

        const template = await window.api.quotationTemplates.get(bundle.templateId)
        if (template) {
          const values: Record<string, unknown> = {}
          for (const section of template.sections) {
            for (const field of section.fields) {
              const match = bundle.customValues.find(
                (value) => value.fieldDefinitionId === field.id
              )
              if (!match) continue
              if (field.type === 'checkbox') {
                values[field.fieldKey] = match.value === 'true'
              } else if (
                field.type === 'number' ||
                field.type === 'currency' ||
                field.type === 'percentage'
              ) {
                values[field.fieldKey] =
                  match.value != null && match.value !== '' ? Number(match.value) : null
              } else {
                values[field.fieldKey] = match.value ?? ''
              }
            }
          }
          setCustomFieldValues(values)
        }
      })
      .catch((err: unknown) =>
        setError(err instanceof Error ? err.message : 'Failed to load quotation')
      )
  }, [editingId])

  const baseMaterialValue = String(customFieldValues.baseMaterial ?? '')

  const customFields = useMemo(() => {
    if (!templateBundle) return [] as CustomFieldDefinitionWithOptions[]
    return templateBundle.sections
      .filter((section) => section.enabled && section.type !== 'items')
      .flatMap((section) => section.fields)
      .map((field) => {
        // Finish subtypes depend on the selected base material (material sheet).
        if (field.fieldKey !== 'finish') return field
        const allowed = MATERIAL_FINISHES[baseMaterialValue]
        if (!allowed) return field
        return {
          ...field,
          options: field.options.filter((option) => allowed.includes(option.value))
        }
      })
  }, [templateBundle, baseMaterialValue])

  const fieldByKey = useMemo(() => {
    const map = new Map<string, CustomFieldDefinitionWithOptions>()
    for (const field of customFields) map.set(field.fieldKey, field)
    return map
  }, [customFields])

  const setField = (key: string, value: unknown): void => {
    setCustomFieldValues((prev) => ({ ...prev, [key]: value }))
  }

  // Keep the finish value valid for the selected material.
  const allowedFinishes = MATERIAL_FINISHES[baseMaterialValue]
  const currentFinish = String(customFieldValues.finish ?? '')
  const coercedFinish =
    allowedFinishes && currentFinish && !allowedFinishes.includes(currentFinish)
      ? allowedFinishes[0]
      : currentFinish

  useEffect(() => {
    if (coercedFinish === currentFinish) return
    setCustomFieldValues((prev) => ({ ...prev, finish: coercedFinish }))
  }, [coercedFinish, currentFinish])

  // Default the designer name to the logged-in user on new quotations.
  const sessionUser = useAuthStore((state) => state.user)
  useEffect(() => {
    if (editingId != null || !sessionUser) return
    setCustomFieldValues((prev) =>
      prev.designerName ? prev : { ...prev, designerName: sessionUser.displayName }
    )
  }, [editingId, sessionUser])

  // Shutter rates follow the selected finish (PRICE LIST sheet).
  useEffect(() => {
    const rate = FINISH_RATES[coercedFinish]
    if (!rate || products.length === 0) return
    const shutterIds = new Set(
      products.filter((row) => row.itemCode.startsWith('SHT-')).map((row) => row.id)
    )
    setItems((prev) => {
      if (
        !prev.some((item) => item.productId && shutterIds.has(item.productId) && item.rate !== rate)
      ) {
        return prev
      }
      return prev.map((item) =>
        item.productId && shutterIds.has(item.productId) && item.rate !== rate
          ? { ...item, rate }
          : item
      )
    })
  }, [coercedFinish, products])

  // Pre-fill a new quotation from the selected quote type's catalog
  // (Tendam / Basket sheets — exact order, quantities and price-list rates).
  const quoteTypeValue = String(customFieldValues.quoteType ?? '') || 'Tendam'
  const lastPrefilledQuoteType = useRef<string | null>(null)
  useEffect(() => {
    if (editingId != null || products.length === 0) return
    if (lastPrefilledQuoteType.current === quoteTypeValue) return
    const byCode = new Map(products.map((product) => [product.itemCode, product]))
    const rows = catalogForQuoteType(quoteTypeValue)
      .map((line) => {
        const product = byCode.get(line.itemCode)
        if (!product) return null
        const subtypeOptions = KITCHEN_SUBTYPES_BY_CODE[line.itemCode]
        const defaultSubtype = subtypeOptions
          ? subtypeOptions.includes(line.name)
            ? line.name
            : subtypeOptions[0]
          : ''
        return {
          key: newKey(),
          productId: product.id,
          qty: line.defaultQty,
          rate: line.rate,
          discount: 0,
          discountType: 'fixed' as const,
          taxPercent: product.taxPercent,
          columnValues: {
            description: line.name,
            specs: product.description ?? '',
            unit: line.unit,
            image: product.imagePath ?? '',
            category: kitchenGroupLabel(line.group),
            subtype: defaultSubtype
          }
        }
      })
      .filter((row): row is NonNullable<typeof row> => Boolean(row))
    if (rows.length === 0) return

    const firstLoad = lastPrefilledQuoteType.current == null
    lastPrefilledQuoteType.current = quoteTypeValue
    let applied = false
    setItems((prev) => {
      const untouched = firstLoad
        ? prev.length === 1 && !prev[0].productId && !prev[0].columnValues?.description
        : true // switching quote type on a new quotation reloads the catalog
      applied = untouched
      return untouched ? rows : prev
    })
    // Default document discount per quote type (Tendam 25%, Basket 10%).
    const subtotal = rows.reduce((sum, row) => sum + row.qty * row.rate, 0)
    const pct = QUOTE_TYPE_DISCOUNT_PERCENT[quoteTypeValue] ?? 0
    if (applied || !firstLoad) {
      setDiscountTotal(Math.round(subtotal * pct) / 100)
    }
  }, [editingId, products, quoteTypeValue])

  const updateItem = (key: string, patch: Partial<EditorItem>): void => {
    setItems((prev) => prev.map((item) => (item.key === key ? { ...item, ...patch } : item)))
  }

  /** Subtype change with price-list side effects (drawer brand / handle type). */
  const applySubtype = (item: EditorItem, subtype: string): void => {
    const product = item.productId
      ? products.find((row) => row.id === item.productId)
      : undefined
    const group = product ? KITCHEN_SUBTYPE_GROUP_BY_CODE[product.itemCode] : undefined
    const patch: Partial<EditorItem> = {
      columnValues: { ...item.columnValues, subtype }
    }
    if (group === 'drawer' && product) {
      const rates = DRAWER_SET_RATES[subtype]
      if (rates) patch.rate = product.itemCode === 'TD-POT' ? rates[1] : rates[0]
    }
    if (group === 'handle') {
      const handle = HANDLE_RATES[subtype]
      if (handle) {
        patch.rate = handle.rate
        patch.columnValues = {
          ...patch.columnValues,
          description: subtype,
          unit: handle.unit,
          image: HANDLE_IMAGES[subtype]
            ? `products/kitchen/${HANDLE_IMAGES[subtype]}`
            : String(item.columnValues?.image ?? '')
        }
      }
    }
    updateItem(item.key, patch)
  }

  const totals = useMemo(
    () =>
      calculateQuotationTotals(
        items.map((item) => ({
          qty: item.qty,
          rate: item.rate,
          discount: item.discount ?? 0,
          discountType: item.discountType ?? 'fixed'
        })),
        charges.map((charge) => ({
          type: charge.type,
          value: charge.value,
          appliesToSubtotal: charge.appliesToSubtotal ?? true
        })),
        discountTotal
      ),
    [items, charges, discountTotal]
  )

  const buildPayload = (): Parameters<typeof window.api.quotations.create>[0] => {
    if (templateId === '' || customerId === '') {
      throw new Error('Please select or add a customer first')
    }

    const customValues = customFields.map((field) => {
      const raw = customFieldValues[field.fieldKey]
      let value: string | null = null
      if (raw == null || raw === '') value = null
      else if (typeof raw === 'boolean') value = String(raw)
      else value = String(raw)
      return { fieldDefinitionId: field.id, value }
    })

    return {
      date,
      customerId,
      templateId,
      currency,
      discountTotal,
      notesInternal,
      notesCustomer,
      customValues,
      items: items.map(({ key: _key, ...item }) => item),
      charges: charges.map(({ key: _key, ...charge }) => charge)
    }
  }

  const handleSaveDraft = async (): Promise<void> => {
    setSaving(true)
    try {
      const payload = { ...buildPayload(), status: 'Draft' as const }
      const saved =
        editingId == null
          ? await window.api.quotations.create(payload)
          : await window.api.quotations.update(editingId, payload)
      setInfo(`Saved draft ${saved.quotationNumber}`)
      navigate(`/quotations/${saved.id}`, { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  const handleFinalize = async (): Promise<void> => {
    setSaving(true)
    try {
      const payload = buildPayload()
      const saved =
        editingId == null
          ? await window.api.quotations.create({ ...payload, status: 'Finalized' })
          : await window.api.quotations.update(editingId, { ...payload, status: 'Finalized' })
      if (editingId != null && saved.status !== 'Finalized') {
        await window.api.quotations.finalize(saved.id)
      }
      setInfo(`Finalized ${saved.quotationNumber}`)
      navigate(`/quotations/${saved.id}`, { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Finalize failed')
    } finally {
      setSaving(false)
    }
  }

  const handleCreateCustomer = async (): Promise<void> => {
    if (!customerDraft.name.trim()) {
      setError('Customer name is required')
      return
    }
    setCustomerSaving(true)
    try {
      const created = await window.api.customers.create({
        name: customerDraft.name.trim(),
        phone: customerDraft.phone.trim() || null,
        email: customerDraft.email.trim() || null,
        address: customerDraft.address.trim() || null
      })
      const rows = await window.api.customers.list()
      setCustomers(rows)
      setCustomerId(created.id)
      setCustomerFormOpen(false)
      setCustomerDraft(EMPTY_CUSTOMER_DRAFT)
      setInfo(`Customer "${created.name}" added`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add customer')
    } finally {
      setCustomerSaving(false)
    }
  }

  const handleAddProduct = (): void => {
    const catalogProduct =
      productDraft.productId !== ''
        ? products.find((row) => row.id === productDraft.productId)
        : undefined
    const description = productDraft.description.trim() || catalogProduct?.name || 'New product'
    const subtypeOptions = catalogProduct
      ? KITCHEN_SUBTYPES_BY_CODE[catalogProduct.itemCode]
      : undefined
    setItems((prev) => [
      ...prev,
      {
        key: newKey(),
        productId: catalogProduct?.id ?? null,
        qty: productDraft.qty,
        rate: productDraft.rate,
        discount: 0,
        discountType: 'fixed',
        taxPercent: catalogProduct?.taxPercent ?? 0,
        columnValues: {
          description,
          specs: catalogProduct?.description ?? '',
          unit: productDraft.unit,
          image: catalogProduct?.imagePath ?? '',
          category: productDraft.category,
          subtype: subtypeOptions ? subtypeOptions[0] : ''
        }
      }
    ])
    setProductDialogOpen(false)
    setProductDraft(EMPTY_PRODUCT_DRAFT)
  }

  const selectedCustomer = customers.find((row) => row.id === customerId) ?? null
  const quoteNumber = existing?.quotationNumber || peekNumber || '—'
  const companyName = company?.name ?? 'SILEX KITCHEN'
  const currencySymbol = currency === 'INR' ? '₹' : currency

  const categoryOptions = useMemo(() => {
    const set = new Set<string>()
    for (const item of items) {
      const category = String(item.columnValues?.category ?? '').trim()
      if (category) set.add(category)
    }
    return [...set]
  }, [items])

  const quoteTypeField = fieldByKey.get('quoteType')
  const materialField = fieldByKey.get('baseMaterial')
  const finishField = fieldByKey.get('finish')

  const formatMoney = (value: number): string =>
    `${currencySymbol} ${value.toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`

  return (
    <PageShell
      title={
        editingId == null
          ? `New quotation — ${quoteTypeValue}${baseMaterialValue ? ` · ${baseMaterialValue}` : ''}${
              coercedFinish ? ` · ${coercedFinish}` : ''
            }`
          : existing?.quotationNumber || 'Edit quotation'
      }
      subtitle={
        editingId == null
          ? 'Work directly inside the quote — edit details, rates and quantities in place.'
          : `Status: ${existing?.status ?? '—'}${
              existing && existing.revisionNumber > 0 ? ` · R${existing.revisionNumber}` : ''
            }`
      }
      actions={
        <>
          <Button variant="outlined" onClick={() => navigate('/quotations')}>
            Back
          </Button>
          {editingId != null && (
            <>
              <Button
                variant="outlined"
                startIcon={<VisibilityOutlinedIcon />}
                onClick={() => navigate(`/quotations/${editingId}/preview`)}
              >
                Preview
              </Button>
              <Button
                variant="outlined"
                startIcon={<PictureAsPdfIcon />}
                disabled={saving}
                onClick={() => {
                  void window.api.documents
                    .exportPdf(editingId)
                    .catch((err: unknown) =>
                      setError(err instanceof Error ? err.message : 'PDF export failed')
                    )
                }}
              >
                Export PDF
              </Button>
              <Button
                variant="outlined"
                startIcon={<PrintIcon />}
                disabled={saving}
                onClick={() => {
                  void window.api.documents
                    .print(editingId)
                    .catch((err: unknown) =>
                      setError(err instanceof Error ? err.message : 'Print failed')
                    )
                }}
              >
                Print
              </Button>
            </>
          )}
          <Button variant="outlined" disabled={saving} onClick={() => void handleSaveDraft()}>
            Save draft
          </Button>
          <Button variant="contained" disabled={saving} onClick={() => void handleFinalize()}>
            Finalize
          </Button>
        </>
      }
    >
      {error && (
        <Alert severity="error" onClose={() => setError('')}>
          {error}
        </Alert>
      )}
      {info && (
        <Alert severity="success" onClose={() => setInfo('')}>
          {info}
        </Alert>
      )}

      {templates.length > 1 && (
        <Stack direction="row" spacing={2}>
          <TextField
            select
            size="small"
            label="Template"
            value={templateId}
            onChange={(event) => setTemplateId(Number(event.target.value))}
            sx={{ minWidth: 220 }}
          >
            {templates.map((template) => (
              <MenuItem key={template.id} value={template.id}>
                {template.name}
              </MenuItem>
            ))}
          </TextField>
        </Stack>
      )}

      {/* The quotation document — edited in place */}
      <div className="qe-shell">
        <article className="qe-page">
          {letterhead && <img className="qe-letterhead" src={letterhead} alt="" />}

          <header className="qe-header">
            <div>
              <div className="qe-company">{companyName}</div>
              <div className="qe-muted">Tax: GST 18% applicable</div>
            </div>
            <div className="qe-meta">
              <h2>QUOTATION</h2>
              <div className="qe-meta-line">
                <strong>Quote No.</strong> {quoteNumber}
              </div>
              <div className="qe-meta-line">
                <strong>Date</strong>{' '}
                <input
                  type="date"
                  value={date}
                  onChange={(event) => setDate(event.target.value)}
                />
              </div>
            </div>
          </header>

          <div className="qe-grid">
            <section className="qe-block">
              <h3>
                Customer Details
                <button
                  type="button"
                  className="qe-link-btn"
                  onClick={() => setCustomerFormOpen((open) => !open)}
                >
                  {customerFormOpen ? 'Close' : '+ New customer'}
                </button>
              </h3>
              <select
                className="qe-customer-select"
                value={customerId}
                onChange={(event) =>
                  setCustomerId(event.target.value === '' ? '' : Number(event.target.value))
                }
              >
                <option value="">— Select customer —</option>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name}
                  </option>
                ))}
              </select>
              {selectedCustomer && (
                <dl className="qe-dl">
                  <dt>Name</dt>
                  <dd>{selectedCustomer.name}</dd>
                  <dt>Email</dt>
                  <dd>{selectedCustomer.email || '—'}</dd>
                  <dt>Contact No</dt>
                  <dd>{selectedCustomer.phone || '—'}</dd>
                  <dt>Address</dt>
                  <dd>{selectedCustomer.billingAddress || selectedCustomer.address || '—'}</dd>
                </dl>
              )}
              {customerFormOpen && (
                <div className="qe-new-customer">
                  <input
                    placeholder="Customer name *"
                    value={customerDraft.name}
                    onChange={(event) =>
                      setCustomerDraft((prev) => ({ ...prev, name: event.target.value }))
                    }
                    autoFocus
                  />
                  <input
                    placeholder="Contact no"
                    value={customerDraft.phone}
                    onChange={(event) =>
                      setCustomerDraft((prev) => ({ ...prev, phone: event.target.value }))
                    }
                  />
                  <input
                    placeholder="Email"
                    value={customerDraft.email}
                    onChange={(event) =>
                      setCustomerDraft((prev) => ({ ...prev, email: event.target.value }))
                    }
                  />
                  <input
                    placeholder="Address / project location"
                    value={customerDraft.address}
                    onChange={(event) =>
                      setCustomerDraft((prev) => ({ ...prev, address: event.target.value }))
                    }
                  />
                  <div className="qe-new-customer-actions">
                    <Button
                      size="small"
                      onClick={() => {
                        setCustomerFormOpen(false)
                        setCustomerDraft(EMPTY_CUSTOMER_DRAFT)
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      size="small"
                      variant="contained"
                      disabled={customerSaving || !customerDraft.name.trim()}
                      onClick={() => void handleCreateCustomer()}
                    >
                      Save customer
                    </Button>
                  </div>
                </div>
              )}
            </section>

            <section className="qe-block">
              <h3>Sales Representative Details</h3>
              <dl className="qe-dl">
                <dt>Sales Executive</dt>
                <dd>
                  <input
                    value={String(customFieldValues.salesExecutive ?? '')}
                    onChange={(event) => setField('salesExecutive', event.target.value)}
                    placeholder="—"
                  />
                </dd>
                <dt>Designer</dt>
                <dd>
                  <input
                    value={String(customFieldValues.designerName ?? '')}
                    onChange={(event) => setField('designerName', event.target.value)}
                    placeholder="—"
                  />
                </dd>
                <dt>Contact No</dt>
                <dd>
                  <input
                    value={String(customFieldValues.designerContact ?? '')}
                    onChange={(event) => setField('designerContact', event.target.value)}
                    placeholder="—"
                  />
                </dd>
                <dt>Email</dt>
                <dd>
                  <input
                    value={String(customFieldValues.designerEmail ?? '')}
                    onChange={(event) => setField('designerEmail', event.target.value)}
                    placeholder="—"
                  />
                </dd>
              </dl>
            </section>
          </div>

          <div className="qe-options">
            <div>
              <span>Quotation Type</span>
              <select
                value={quoteTypeValue}
                onChange={(event) => setField('quoteType', event.target.value)}
              >
                {(quoteTypeField?.options.length
                  ? quoteTypeField.options.map((option) => option.value)
                  : ['Tendam', 'Basket']
                ).map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <span>Material Type</span>
              <select
                value={baseMaterialValue}
                onChange={(event) => setField('baseMaterial', event.target.value)}
              >
                {(materialField?.options.length
                  ? materialField.options.map((option) => option.value)
                  : Object.keys(MATERIAL_FINISHES)
                ).map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <span>Subtype / Finish</span>
              <select
                value={coercedFinish}
                onChange={(event) => setField('finish', event.target.value)}
              >
                {(finishField?.options.length
                  ? finishField.options.map((option) => option.value)
                  : allowedFinishes ?? []
                ).map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <span>Project</span>
              <input
                value={String(customFieldValues.projectName ?? '')}
                onChange={(event) => setField('projectName', event.target.value)}
                placeholder="Project name"
              />
            </div>
          </div>

          <table className="qe-table">
            <thead>
              <tr>
                <th style={{ width: '2.4rem' }}>Sr.No.</th>
                <th style={{ width: '3.4rem' }}>Image</th>
                <th>Description</th>
                <th style={{ width: '4.4rem' }}>Qty</th>
                <th style={{ width: '4.4rem' }}>Unit</th>
                <th style={{ width: '5.4rem' }}>Rate</th>
                <th style={{ width: '6.4rem' }}>Total</th>
                <th style={{ width: '2rem' }} />
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => {
                const category = String(item.columnValues?.category ?? '')
                const prevCategory =
                  index > 0 ? String(items[index - 1].columnValues?.category ?? '') : null
                const showBand = category !== '' && category !== prevCategory
                const product = item.productId
                  ? products.find((row) => row.id === item.productId)
                  : undefined
                const subtypeOptions = product
                  ? KITCHEN_SUBTYPES_BY_CODE[product.itemCode]
                  : undefined
                const unit = String(item.columnValues?.unit ?? '')
                const unitChoices = UNIT_OPTIONS.includes(unit) || !unit
                  ? UNIT_OPTIONS
                  : [unit, ...UNIT_OPTIONS]
                return (
                  <Fragment key={item.key}>
                    {showBand && (
                      <tr className="qe-cat-row">
                        <td colSpan={8}>
                          {displayCategory(category, baseMaterialValue, coercedFinish)}
                        </td>
                      </tr>
                    )}
                    <tr>
                      <td className="qe-center">{index + 1}</td>
                      <td>
                        <ItemThumb
                          path={String(item.columnValues?.image ?? '')}
                          onChange={(nextPath) =>
                            updateItem(item.key, {
                              columnValues: { ...item.columnValues, image: nextPath }
                            })
                          }
                        />
                      </td>
                      <td>
                        <input
                          value={String(item.columnValues?.description ?? '')}
                          onChange={(event) =>
                            updateItem(item.key, {
                              columnValues: {
                                ...item.columnValues,
                                description: event.target.value
                              }
                            })
                          }
                        />
                        {subtypeOptions && (
                          <select
                            className="qe-subtype"
                            value={String(item.columnValues?.subtype ?? '')}
                            onChange={(event) => applySubtype(item, event.target.value)}
                          >
                            {subtypeOptions.map((option) => (
                              <option key={option} value={option}>
                                {option}
                              </option>
                            ))}
                          </select>
                        )}
                      </td>
                      <td>
                        <input
                          type="number"
                          min={0}
                          step="0.1"
                          value={item.qty}
                          onChange={(event) =>
                            updateItem(item.key, { qty: Number(event.target.value) })
                          }
                        />
                      </td>
                      <td>
                        <select
                          value={unit}
                          onChange={(event) =>
                            updateItem(item.key, {
                              columnValues: { ...item.columnValues, unit: event.target.value }
                            })
                          }
                        >
                          {unitChoices.map((option) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <input
                          type="number"
                          min={0}
                          value={item.rate}
                          onChange={(event) =>
                            updateItem(item.key, { rate: Number(event.target.value) })
                          }
                        />
                      </td>
                      <td className="qe-num">
                        <strong>{formatMoney(totals.lines[index]?.amount ?? 0)}</strong>
                      </td>
                      <td className="qe-center">
                        <button
                          type="button"
                          className="qe-del-btn"
                          title="Remove row"
                          disabled={items.length === 1}
                          onClick={() =>
                            setItems((prev) => prev.filter((row) => row.key !== item.key))
                          }
                        >
                          ✕
                        </button>
                      </td>
                    </tr>
                  </Fragment>
                )
              })}
            </tbody>
          </table>

          <div className="qe-addbar">
            <Button
              variant="outlined"
              size="small"
              startIcon={<AddIcon />}
              onClick={() => {
                setProductDraft({
                  ...EMPTY_PRODUCT_DRAFT,
                  category: categoryOptions[categoryOptions.length - 1] ?? ''
                })
                setProductDialogOpen(true)
              }}
            >
              Add Product
            </Button>
          </div>

          <div className="qe-summary">
            <div className="qe-row">
              <span>Subtotal</span>
              <span>{formatMoney(totals.subtotal)}</span>
            </div>
            <div className="qe-row">
              <span>Discount</span>
              <input
                type="number"
                min={0}
                value={discountTotal}
                onChange={(event) => setDiscountTotal(Number(event.target.value))}
              />
            </div>
            {totals.taxTotal > 0 && (
              <div className="qe-row">
                <span>Tax</span>
                <span>{formatMoney(totals.taxTotal)}</span>
              </div>
            )}
            {totals.otherCharges > 0 && (
              <div className="qe-row">
                <span>Other charges</span>
                <span>{formatMoney(totals.otherCharges)}</span>
              </div>
            )}
            <div className="qe-row qe-grand">
              <span>Grand Total</span>
              <span>{formatMoney(totals.grandTotal)}</span>
            </div>
          </div>
        </article>
      </div>

      {/* Add product dialog (demo-style) */}
      <Dialog
        open={productDialogOpen}
        onClose={() => setProductDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Add New Product</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              select
              size="small"
              label="From catalog (optional)"
              value={productDraft.productId}
              onChange={(event) => {
                const value = event.target.value
                if (value === '') {
                  setProductDraft((prev) => ({ ...prev, productId: '' }))
                  return
                }
                const product = products.find((row) => row.id === Number(value))
                setProductDraft((prev) => ({
                  ...prev,
                  productId: Number(value),
                  description: product?.name ?? prev.description,
                  rate: product?.standardPrice ?? prev.rate,
                  unit: product?.unit || prev.unit,
                  category: product?.category || prev.category
                }))
              }}
              fullWidth
            >
              <MenuItem value="">— Custom product —</MenuItem>
              {products.map((product) => (
                <MenuItem key={product.id} value={product.id}>
                  {product.name}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              size="small"
              label="Description"
              value={productDraft.description}
              onChange={(event) =>
                setProductDraft((prev) => ({ ...prev, description: event.target.value }))
              }
              placeholder="e.g. Corner Carousel Unit"
              fullWidth
            />
            <TextField
              select
              size="small"
              label="Category"
              value={productDraft.category}
              onChange={(event) =>
                setProductDraft((prev) => ({ ...prev, category: event.target.value }))
              }
              fullWidth
            >
              <MenuItem value="">— None —</MenuItem>
              {categoryOptions.map((option) => (
                <MenuItem key={option} value={option}>
                  {displayCategory(option, baseMaterialValue, coercedFinish)}
                </MenuItem>
              ))}
            </TextField>
            <Stack direction="row" spacing={2}>
              <TextField
                size="small"
                type="number"
                label="Qty"
                value={productDraft.qty}
                onChange={(event) =>
                  setProductDraft((prev) => ({ ...prev, qty: Number(event.target.value) }))
                }
                sx={{ flex: 1 }}
              />
              <TextField
                select
                size="small"
                label="Unit"
                value={productDraft.unit}
                onChange={(event) =>
                  setProductDraft((prev) => ({ ...prev, unit: event.target.value }))
                }
                sx={{ flex: 1 }}
              >
                {UNIT_OPTIONS.map((option) => (
                  <MenuItem key={option} value={option}>
                    {option}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                size="small"
                type="number"
                label={`Rate (${currencySymbol})`}
                value={productDraft.rate}
                onChange={(event) =>
                  setProductDraft((prev) => ({ ...prev, rate: Number(event.target.value) }))
                }
                sx={{ flex: 1 }}
              />
            </Stack>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setProductDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleAddProduct}>
            Add to Quote
          </Button>
        </DialogActions>
      </Dialog>

      {/* Charges */}
      <Paper variant="outlined" sx={{ p: { xs: 1.5, sm: 2 }, minWidth: 0 }}>
        <Stack spacing={2}>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={1}
            sx={{ justifyContent: 'space-between', alignItems: { sm: 'center' } }}
          >
            <Typography variant="h6">Charges</Typography>
            <Button
              size="small"
              startIcon={<AddIcon />}
              onClick={() =>
                setCharges((prev) => [
                  ...prev,
                  {
                    key: newKey(),
                    name: 'Charge',
                    type: 'percentage',
                    value: 0,
                    appliesToSubtotal: true
                  }
                ])
              }
            >
              Add charge
            </Button>
          </Stack>
          <TableContainer sx={{ overflowX: 'auto', width: '100%' }}>
            <Table size="small" sx={{ minWidth: 480 }}>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Value</TableCell>
                  <TableCell align="right">Amount</TableCell>
                  <TableCell />
                </TableRow>
              </TableHead>
              <TableBody>
                {charges.map((charge, index) => (
                  <TableRow key={charge.key}>
                    <TableCell>
                      <TextField
                        size="small"
                        value={charge.name}
                        onChange={(event) =>
                          setCharges((prev) =>
                            prev.map((row) =>
                              row.key === charge.key ? { ...row, name: event.target.value } : row
                            )
                          )
                        }
                        fullWidth
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        select
                        size="small"
                        value={charge.type}
                        onChange={(event) =>
                          setCharges((prev) =>
                            prev.map((row) =>
                              row.key === charge.key
                                ? {
                                    ...row,
                                    type: event.target.value as 'percentage' | 'fixed'
                                  }
                                : row
                            )
                          )
                        }
                        sx={{ minWidth: 120 }}
                      >
                        <MenuItem value="percentage">Percentage</MenuItem>
                        <MenuItem value="fixed">Fixed</MenuItem>
                      </TextField>
                    </TableCell>
                    <TableCell>
                      <TextField
                        size="small"
                        type="number"
                        value={charge.value}
                        onChange={(event) =>
                          setCharges((prev) =>
                            prev.map((row) =>
                              row.key === charge.key
                                ? { ...row, value: Number(event.target.value) }
                                : row
                            )
                          )
                        }
                        sx={{ width: 100 }}
                      />
                    </TableCell>
                    <TableCell align="right">
                      {(totals.charges[index]?.amount ?? 0).toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <IconButton
                        size="small"
                        onClick={() =>
                          setCharges((prev) => prev.filter((row) => row.key !== charge.key))
                        }
                      >
                        <DeleteOutlinedIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Stack>
      </Paper>

      {/* Notes */}
      <Paper variant="outlined" sx={{ p: { xs: 1.5, sm: 2 }, minWidth: 0 }}>
        <Stack spacing={2}>
          <Typography variant="h6">Notes</Typography>
          <TextField
            label="Internal notes"
            value={notesInternal}
            onChange={(event) => setNotesInternal(event.target.value)}
            fullWidth
            multiline
            minRows={2}
          />
          <TextField
            label="Customer notes"
            value={notesCustomer}
            onChange={(event) => setNotesCustomer(event.target.value)}
            fullWidth
            multiline
            minRows={2}
          />
        </Stack>
      </Paper>
    </PageShell>
  )
}
