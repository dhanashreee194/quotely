import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Alert from '@mui/material/Alert'
import Button from '@mui/material/Button'
import Divider from '@mui/material/Divider'
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
import type {
  ChargeRule,
  Customer,
  CustomFieldDefinitionWithOptions,
  ItemColumnDefinition,
  Product,
  QuotationBundle,
  QuotationChargeInput,
  QuotationItemInput,
  QuotationTemplate,
  QuotationTemplateBundle
} from '../../../shared/types'
import DynamicForm from '../components/DynamicForm'
import PageShell from '../layout/PageShell'

type EditorItem = QuotationItemInput & { key: string }
type EditorCharge = QuotationChargeInput & { key: string }

function today(): string {
  return new Date().toISOString().slice(0, 10)
}

function newKey(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function isCoreColumn(columnKey: string): boolean {
  return columnKey === 'qty' || columnKey === 'rate' || columnKey === 'amount' || columnKey === 'discount'
}

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

  const loadMeta = useCallback(async (): Promise<void> => {
    const [templateRows, customerRows, productRows, rules, peek] = await Promise.all([
      window.api.quotationTemplates.list(),
      window.api.customers.list(),
      window.api.products.list(),
      window.api.chargeRules.list(),
      window.api.numbering.peekNext()
    ])
    setTemplates(templateRows)
    setCustomers(customerRows)
    setProducts(productRows)
    setChargeRules(rules)
    setPeekNumber(peek)

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

  const customFields = useMemo(() => {
    if (!templateBundle) return [] as CustomFieldDefinitionWithOptions[]
    return templateBundle.sections
      .filter((section) => section.enabled && section.type !== 'items')
      .flatMap((section) => section.fields)
  }, [templateBundle])

  const itemColumns = useMemo(
    () => (templateBundle?.itemColumns.filter((column) => column.visible) ?? []) as ItemColumnDefinition[],
    [templateBundle]
  )

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

  const updateItem = (key: string, patch: Partial<EditorItem>): void => {
    setItems((prev) => prev.map((item) => (item.key === key ? { ...item, ...patch } : item)))
  }

  const applyProduct = (key: string, productId: number): void => {
    const product = products.find((row) => row.id === productId)
    if (!product) {
      updateItem(key, { productId })
      return
    }
    updateItem(key, {
      productId,
      rate: product.standardPrice,
      taxPercent: product.taxPercent,
      columnValues: {
        ...items.find((item) => item.key === key)?.columnValues,
        description: product.name,
        unit: product.unit ?? ''
      }
    })
  }

  const buildPayload = (): Parameters<typeof window.api.quotations.create>[0] => {
    if (templateId === '' || customerId === '') {
      throw new Error('Template and customer are required')
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

  return (
    <PageShell
      title={editingId == null ? 'New quotation' : existing?.quotationNumber || 'Edit quotation'}
      subtitle={
        editingId == null
          ? `Next number preview: ${peekNumber || '—'}`
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
      {error && <Alert severity="error">{error}</Alert>}
      {info && (
        <Alert severity="success" onClose={() => setInfo('')}>
          {info}
        </Alert>
      )}

      <Paper variant="outlined" sx={{ p: { xs: 1.5, sm: 2 }, minWidth: 0 }}>
        <Stack spacing={2}>
          <Typography variant="h6">Header</Typography>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} useFlexGap sx={{ flexWrap: 'wrap' }}>
            <TextField
              select
              label="Template"
              value={templateId}
              onChange={(event) => setTemplateId(Number(event.target.value))}
              fullWidth
              required
              sx={{ flex: '1 1 200px', minWidth: 0 }}
            >
              {templates.map((template) => (
                <MenuItem key={template.id} value={template.id}>
                  {template.name}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              label="Customer"
              value={customerId}
              onChange={(event) => setCustomerId(Number(event.target.value))}
              fullWidth
              required
              sx={{ flex: '1 1 200px', minWidth: 0 }}
            >
              {customers.map((customer) => (
                <MenuItem key={customer.id} value={customer.id}>
                  {customer.name}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              type="date"
              label="Date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
              fullWidth
              sx={{ flex: '1 1 160px', minWidth: 0 }}
            />
            <TextField
              label="Currency"
              value={currency}
              onChange={(event) => setCurrency(event.target.value)}
              fullWidth
              sx={{ flex: '1 1 120px', minWidth: 0 }}
            />
          </Stack>

          {customFields.length > 0 && (
            <>
              <Divider />
              <Typography variant="subtitle1">Custom fields</Typography>
              <DynamicForm
                key={`custom-${editingId ?? 'new'}-${customFields.map((field) => field.id).join('-')}-${
                  existing ? 'loaded' : 'blank'
                }`}
                fields={customFields}
                hideSubmit
                initialValues={customFieldValues}
                onChange={setCustomFieldValues}
              />
            </>
          )}
        </Stack>
      </Paper>

      <Paper variant="outlined" sx={{ p: { xs: 1.5, sm: 2 }, minWidth: 0 }}>
        <Stack spacing={2}>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={1}
            sx={{ justifyContent: 'space-between', alignItems: { sm: 'center' } }}
          >
            <Typography variant="h6">Line items</Typography>
            <Button
              size="small"
              startIcon={<AddIcon />}
              onClick={() =>
                setItems((prev) => [
                  ...prev,
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
              }
            >
              Add line
            </Button>
          </Stack>

          <TableContainer sx={{ overflowX: 'auto', width: '100%' }}>
          <Table size="small" sx={{ minWidth: 720 }}>
            <TableHead>
              <TableRow>
                <TableCell>Product</TableCell>
                {itemColumns.map((column) => (
                  <TableCell key={column.id}>{column.label}</TableCell>
                ))}
                <TableCell>Discount</TableCell>
                <TableCell>Disc. type</TableCell>
                <TableCell align="right">Amount</TableCell>
                <TableCell />
              </TableRow>
            </TableHead>
            <TableBody>
              {items.map((item, index) => (
                <TableRow key={item.key}>
                  <TableCell sx={{ minWidth: 160 }}>
                    <TextField
                      select
                      size="small"
                      value={item.productId ?? ''}
                      onChange={(event) => {
                        const value = event.target.value
                        if (value === '') {
                          updateItem(item.key, { productId: null })
                        } else {
                          applyProduct(item.key, Number(value))
                        }
                      }}
                      fullWidth
                    >
                      <MenuItem value="">One-off</MenuItem>
                      {products.map((product) => (
                        <MenuItem key={product.id} value={product.id}>
                          {product.name}
                        </MenuItem>
                      ))}
                    </TextField>
                  </TableCell>
                  {itemColumns.map((column) => {
                    if (column.columnKey === 'qty') {
                      return (
                        <TableCell key={column.id}>
                          <TextField
                            size="small"
                            type="number"
                            value={item.qty}
                            onChange={(event) =>
                              updateItem(item.key, { qty: Number(event.target.value) })
                            }
                            sx={{ width: column.width ?? 90 }}
                          />
                        </TableCell>
                      )
                    }
                    if (column.columnKey === 'rate') {
                      return (
                        <TableCell key={column.id}>
                          <TextField
                            size="small"
                            type="number"
                            value={item.rate}
                            onChange={(event) =>
                              updateItem(item.key, { rate: Number(event.target.value) })
                            }
                            sx={{ width: column.width ?? 100 }}
                          />
                        </TableCell>
                      )
                    }
                    if (column.columnKey === 'amount') {
                      return (
                        <TableCell key={column.id} align="right">
                          {(totals.lines[index]?.amount ?? 0).toFixed(2)}
                        </TableCell>
                      )
                    }
                    if (isCoreColumn(column.columnKey)) {
                      return <TableCell key={column.id}>—</TableCell>
                    }
                    return (
                      <TableCell key={column.id}>
                        <TextField
                          size="small"
                          type={
                            column.dataType === 'text' || column.dataType === undefined
                              ? 'text'
                              : 'number'
                          }
                          value={String(item.columnValues?.[column.columnKey] ?? '')}
                          onChange={(event) =>
                            updateItem(item.key, {
                              columnValues: {
                                ...item.columnValues,
                                [column.columnKey]:
                                  column.dataType === 'text'
                                    ? event.target.value
                                    : Number(event.target.value)
                              }
                            })
                          }
                          sx={{ width: column.width ?? 140 }}
                        />
                      </TableCell>
                    )
                  })}
                  <TableCell>
                    <TextField
                      size="small"
                      type="number"
                      value={item.discount ?? 0}
                      onChange={(event) =>
                        updateItem(item.key, { discount: Number(event.target.value) })
                      }
                      sx={{ width: 90 }}
                    />
                  </TableCell>
                  <TableCell>
                    <TextField
                      select
                      size="small"
                      value={item.discountType ?? 'fixed'}
                      onChange={(event) =>
                        updateItem(item.key, {
                          discountType: event.target.value as 'fixed' | 'percentage'
                        })
                      }
                      sx={{ width: 110 }}
                    >
                      <MenuItem value="fixed">Fixed</MenuItem>
                      <MenuItem value="percentage">%</MenuItem>
                    </TextField>
                  </TableCell>
                  <TableCell align="right">
                    {(totals.lines[index]?.amount ?? 0).toFixed(2)}
                  </TableCell>
                  <TableCell>
                    <IconButton
                      size="small"
                      disabled={items.length === 1}
                      onClick={() => setItems((prev) => prev.filter((row) => row.key !== item.key))}
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

          <Stack spacing={1} sx={{ width: '100%', maxWidth: { sm: 360 }, ml: { sm: 'auto' } }}>
            <TextField
              size="small"
              type="number"
              label="Document discount"
              value={discountTotal}
              onChange={(event) => setDiscountTotal(Number(event.target.value))}
              fullWidth
            />
            <Stack direction="row" sx={{ justifyContent: 'space-between' }}>
              <Typography color="text.secondary">Subtotal</Typography>
              <Typography>{totals.subtotal.toFixed(2)}</Typography>
            </Stack>
            <Stack direction="row" sx={{ justifyContent: 'space-between' }}>
              <Typography color="text.secondary">Discount</Typography>
              <Typography>{totals.discountTotal.toFixed(2)}</Typography>
            </Stack>
            <Stack direction="row" sx={{ justifyContent: 'space-between' }}>
              <Typography color="text.secondary">Tax</Typography>
              <Typography>{totals.taxTotal.toFixed(2)}</Typography>
            </Stack>
            <Stack direction="row" sx={{ justifyContent: 'space-between' }}>
              <Typography color="text.secondary">Other charges</Typography>
              <Typography>{totals.otherCharges.toFixed(2)}</Typography>
            </Stack>
            <Divider />
            <Stack direction="row" sx={{ justifyContent: 'space-between' }}>
              <Typography variant="h6">Grand total</Typography>
              <Typography variant="h6">{totals.grandTotal.toFixed(2)}</Typography>
            </Stack>
          </Stack>
        </Stack>
      </Paper>

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
