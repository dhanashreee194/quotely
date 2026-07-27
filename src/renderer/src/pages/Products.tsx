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

function ProductThumb({ path }: { path: string | null }): React.JSX.Element {
  const [src, setSrc] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    if (!path) {
      setSrc(null)
      return
    }
    void window.api.assets.getDataUrl(path).then((url) => {
      if (!cancelled) setSrc(url)
    })
    return () => {
      cancelled = true
    }
  }, [path])

  if (!src) {
    return (
      <Box
        sx={{
          width: 40,
          height: 40,
          bgcolor: 'action.hover',
          borderRadius: 0.5
        }}
      />
    )
  }

  return (
    <Box
      component="img"
      src={src}
      alt=""
      sx={{ width: 40, height: 40, objectFit: 'contain', display: 'block' }}
    />
  )
}

const emptyValues: ProductFormValues = {
  itemCode: '',
  name: '',
  description: '',
  unit: '',
  imagePath: '',
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
  const [imagePreview, setImagePreview] = useState<string | null>(null)

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
      setImagePreview(null)
      return
    }

    void window.api.products.get(editingId).then(async (product) => {
      if (!product) return
      form.reset({
        itemCode: product.itemCode,
        name: product.name,
        description: product.description ?? '',
        unit: product.unit ?? '',
        imagePath: product.imagePath ?? '',
        standardPrice: product.standardPrice,
        taxPercent: product.taxPercent,
        category: product.category ?? '',
        hsnSac: product.hsnSac ?? ''
      })
      if (product.imagePath) {
        setImagePreview(await window.api.assets.getDataUrl(product.imagePath))
      } else {
        setImagePreview(null)
      }
    })
  }, [dialogOpen, editingId, form])

  const pickProductImage = async (): Promise<void> => {
    try {
      const relativePath = await window.api.assets.pickImage('product')
      if (!relativePath) return
      form.setValue('imagePath', relativePath)
      setImagePreview(await window.api.assets.getDataUrl(relativePath))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to pick image')
    }
  }

  const clearProductImage = (): void => {
    form.setValue('imagePath', '')
    setImagePreview(null)
  }

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
              <TableCell sx={{ width: 56 }}>Image</TableCell>
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
                <TableCell colSpan={showSecondaryCols ? 8 : 5}>
                  <Typography color="text.secondary">No products found.</Typography>
                </TableCell>
              </TableRow>
            )}
            {rows.map((row) => (
              <TableRow key={row.id} hover>
                <TableCell>
                  <ProductThumb path={row.imagePath} />
                </TableCell>
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
                    label="Specs / description"
                    placeholder="e.g. 450MM, ply thickness, finish"
                    error={Boolean(fieldState.error)}
                    helperText={
                      fieldState.error?.message ??
                      'Shown in the Specs column when this product is added to a quote.'
                    }
                    fullWidth
                    multiline
                    minRows={2}
                  />
                )}
              />
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  Product image
                </Typography>
                <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
                  <Box
                    sx={{
                      width: 72,
                      height: 72,
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      overflow: 'hidden',
                      bgcolor: 'action.hover'
                    }}
                  >
                    {imagePreview ? (
                      <Box
                        component="img"
                        src={imagePreview}
                        alt=""
                        sx={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                      />
                    ) : (
                      <Typography variant="caption" color="text.secondary">
                        None
                      </Typography>
                    )}
                  </Box>
                  <Stack direction="row" spacing={1}>
                    <Button variant="outlined" size="small" onClick={() => void pickProductImage()}>
                      Choose image
                    </Button>
                    {imagePreview && (
                      <Button size="small" onClick={clearProductImage}>
                        Clear
                      </Button>
                    )}
                  </Stack>
                </Stack>
                <Controller
                  name="imagePath"
                  control={form.control}
                  render={({ field }) => <input type="hidden" {...field} value={field.value ?? ''} />}
                />
              </Box>
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
