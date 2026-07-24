import { useCallback, useEffect, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import IconButton from '@mui/material/IconButton'
import Stack from '@mui/material/Stack'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import useMediaQuery from '@mui/material/useMediaQuery'
import { useTheme } from '@mui/material/styles'
import AddIcon from '@mui/icons-material/Add'
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import type { Product } from '../../../shared/types'
import ResponsiveDialog from '../components/ResponsiveDialog'
import PageShell from '../layout/PageShell'
import { productFormSchema, type ProductFormValues } from '../lib/validation'
import { useProductsStore } from '../stores/productsStore'

const emptyValues: ProductFormValues = {
  itemCode: '',
  name: '',
  description: '',
  unit: '',
  standardPrice: 0,
  taxPercent: 0,
  category: '',
  hsnSac: ''
}

export default function ProductsPage(): React.JSX.Element {
  const theme = useTheme()
  const showSecondaryCols = useMediaQuery(theme.breakpoints.up('md'))
  const { search, setSearch, dialogOpen, editingId, openCreate, openEdit, closeDialog } =
    useProductsStore()
  const [rows, setRows] = useState<Product[]>([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: emptyValues
  })

  const load = useCallback(async (): Promise<void> => {
    setLoading(true)
    try {
      const data = await window.api.products.list(search)
      setRows(data)
      setError('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load products')
    } finally {
      setLoading(false)
    }
  }, [search])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    if (!dialogOpen) return

    if (editingId == null) {
      form.reset(emptyValues)
      return
    }

    void window.api.products.get(editingId).then((product) => {
      if (!product) return
      form.reset({
        itemCode: product.itemCode,
        name: product.name,
        description: product.description ?? '',
        unit: product.unit ?? '',
        standardPrice: product.standardPrice,
        taxPercent: product.taxPercent,
        category: product.category ?? '',
        hsnSac: product.hsnSac ?? ''
      })
    })
  }, [dialogOpen, editingId, form])

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      if (editingId == null) {
        await window.api.products.create(values)
      } else {
        await window.api.products.update(editingId, values)
      }
      closeDialog()
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save product')
    }
  })

  const handleDelete = async (id: number): Promise<void> => {
    if (!window.confirm('Delete this product?')) return
    try {
      await window.api.products.remove(id)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete product')
    }
  }

  return (
    <PageShell
      title="Products"
      subtitle="Manage products and pricing used in quotations."
      actions={
        <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
          Add product
        </Button>
      }
    >
      <TextField
        size="small"
        label="Search"
        placeholder="Name, code, category, or HSN/SAC"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        fullWidth
        sx={{ maxWidth: { sm: 360 } }}
      />

      {error && <Alert severity="error">{error}</Alert>}

      <TableContainer sx={{ overflowX: 'auto' }}>
        <Table size="small" sx={{ minWidth: 560 }}>
          <TableHead>
            <TableRow>
              <TableCell>Code</TableCell>
              <TableCell>Name</TableCell>
              {showSecondaryCols && <TableCell>Unit</TableCell>}
              <TableCell align="right">Price</TableCell>
              {showSecondaryCols && <TableCell align="right">Tax %</TableCell>}
              {showSecondaryCols && <TableCell>Category</TableCell>}
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {!loading && rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={showSecondaryCols ? 7 : 4}>
                  <Typography color="text.secondary">No products found.</Typography>
                </TableCell>
              </TableRow>
            )}
            {rows.map((row) => (
              <TableRow key={row.id} hover>
                <TableCell>{row.itemCode}</TableCell>
                <TableCell>{row.name}</TableCell>
                {showSecondaryCols && <TableCell>{row.unit ?? '—'}</TableCell>}
                <TableCell align="right">{row.standardPrice.toFixed(2)}</TableCell>
                {showSecondaryCols && (
                  <TableCell align="right">{row.taxPercent.toFixed(2)}</TableCell>
                )}
                {showSecondaryCols && <TableCell>{row.category ?? '—'}</TableCell>}
                <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                  <IconButton aria-label="Edit" onClick={() => openEdit(row.id)} size="small">
                    <EditOutlinedIcon fontSize="small" />
                  </IconButton>
                  <IconButton
                    aria-label="Delete"
                    onClick={() => void handleDelete(row.id)}
                    size="small"
                  >
                    <DeleteOutlinedIcon fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <ResponsiveDialog open={dialogOpen} onClose={closeDialog} maxWidth="sm">
        <DialogTitle>{editingId == null ? 'Add product' : 'Edit product'}</DialogTitle>
        <Box component="form" onSubmit={onSubmit}>
          <DialogContent>
            <Stack spacing={2} sx={{ pt: 1 }}>
              <Controller
                name="itemCode"
                control={form.control}
                render={({ field, fieldState }) => (
                  <TextField
                    {...field}
                    label="Item code"
                    error={Boolean(fieldState.error)}
                    helperText={fieldState.error?.message}
                    fullWidth
                  />
                )}
              />
              <Controller
                name="name"
                control={form.control}
                render={({ field, fieldState }) => (
                  <TextField
                    {...field}
                    label="Name"
                    error={Boolean(fieldState.error)}
                    helperText={fieldState.error?.message}
                    fullWidth
                  />
                )}
              />
              <Controller
                name="description"
                control={form.control}
                render={({ field, fieldState }) => (
                  <TextField
                    {...field}
                    value={field.value ?? ''}
                    label="Description"
                    error={Boolean(fieldState.error)}
                    helperText={fieldState.error?.message}
                    fullWidth
                    multiline
                    minRows={2}
                  />
                )}
              />
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <Controller
                  name="unit"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <TextField
                      {...field}
                      value={field.value ?? ''}
                      label="Unit"
                      error={Boolean(fieldState.error)}
                      helperText={fieldState.error?.message}
                      fullWidth
                    />
                  )}
                />
                <Controller
                  name="standardPrice"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <TextField
                      name={field.name}
                      ref={field.ref}
                      onBlur={field.onBlur}
                      value={field.value}
                      onChange={(event) => field.onChange(Number(event.target.value))}
                      type="number"
                      label="Standard price"
                      error={Boolean(fieldState.error)}
                      helperText={fieldState.error?.message}
                      fullWidth
                    />
                  )}
                />
                <Controller
                  name="taxPercent"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <TextField
                      name={field.name}
                      ref={field.ref}
                      onBlur={field.onBlur}
                      value={field.value}
                      onChange={(event) => field.onChange(Number(event.target.value))}
                      type="number"
                      label="Tax %"
                      error={Boolean(fieldState.error)}
                      helperText={fieldState.error?.message}
                      fullWidth
                    />
                  )}
                />
              </Stack>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <Controller
                  name="category"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <TextField
                      {...field}
                      value={field.value ?? ''}
                      label="Category"
                      error={Boolean(fieldState.error)}
                      helperText={fieldState.error?.message}
                      fullWidth
                    />
                  )}
                />
                <Controller
                  name="hsnSac"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <TextField
                      {...field}
                      value={field.value ?? ''}
                      label="HSN / SAC"
                      error={Boolean(fieldState.error)}
                      helperText={fieldState.error?.message}
                      fullWidth
                    />
                  )}
                />
              </Stack>
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={closeDialog}>Cancel</Button>
            <Button type="submit" variant="contained">
              Save
            </Button>
          </DialogActions>
        </Box>
      </ResponsiveDialog>
    </PageShell>
  )
}
