import { useCallback, useEffect, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import IconButton from '@mui/material/IconButton'
import Stack from '@mui/material/Stack'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import AddIcon from '@mui/icons-material/Add'
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import type { Customer } from '../../../shared/types'
import { customerFormSchema, type CustomerFormValues } from '../lib/validation'
import { useCustomersStore } from '../stores/customersStore'

const emptyValues: CustomerFormValues = {
  name: '',
  companyName: '',
  contactPerson: '',
  address: '',
  phone: '',
  email: '',
  taxNumber: '',
  billingAddress: '',
  shippingAddress: ''
}

export default function CustomersPage(): React.JSX.Element {
  const { search, setSearch, dialogOpen, editingId, openCreate, openEdit, closeDialog } =
    useCustomersStore()
  const [rows, setRows] = useState<Customer[]>([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  const form = useForm<CustomerFormValues>({
    resolver: zodResolver(customerFormSchema),
    defaultValues: emptyValues
  })

  const load = useCallback(async (): Promise<void> => {
    setLoading(true)
    try {
      const data = await window.api.customers.list(search)
      setRows(data)
      setError('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load customers')
    } finally {
      setLoading(false)
    }
  }, [search])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    if (!dialogOpen) {
      return
    }

    if (editingId == null) {
      form.reset(emptyValues)
      return
    }

    void window.api.customers.get(editingId).then((customer) => {
      if (!customer) return
      form.reset({
        name: customer.name,
        companyName: customer.companyName ?? '',
        contactPerson: customer.contactPerson ?? '',
        address: customer.address ?? '',
        phone: customer.phone ?? '',
        email: customer.email ?? '',
        taxNumber: customer.taxNumber ?? '',
        billingAddress: customer.billingAddress ?? '',
        shippingAddress: customer.shippingAddress ?? ''
      })
    })
  }, [dialogOpen, editingId, form])

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      if (editingId == null) {
        await window.api.customers.create(values)
      } else {
        await window.api.customers.update(editingId, values)
      }
      closeDialog()
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save customer')
    }
  })

  const handleDelete = async (id: number): Promise<void> => {
    if (!window.confirm('Delete this customer?')) return
    try {
      await window.api.customers.remove(id)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete customer')
    }
  }

  return (
    <Stack spacing={2}>
      <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4">Customers</Typography>
          <Typography color="text.secondary">Maintain your customer directory.</Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
          Add customer
        </Button>
      </Stack>

      <TextField
        size="small"
        label="Search"
        placeholder="Name, company, or email"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        sx={{ maxWidth: 360 }}
      />

      {error && <Alert severity="error">{error}</Alert>}

      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Name</TableCell>
            <TableCell>Company</TableCell>
            <TableCell>Email</TableCell>
            <TableCell>Phone</TableCell>
            <TableCell align="right">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {!loading && rows.length === 0 && (
            <TableRow>
              <TableCell colSpan={5}>
                <Typography color="text.secondary">No customers found.</Typography>
              </TableCell>
            </TableRow>
          )}
          {rows.map((row) => (
            <TableRow key={row.id} hover>
              <TableCell>{row.name}</TableCell>
              <TableCell>{row.companyName ?? '—'}</TableCell>
              <TableCell>{row.email ?? '—'}</TableCell>
              <TableCell>{row.phone ?? '—'}</TableCell>
              <TableCell align="right">
                <IconButton aria-label="Edit" onClick={() => openEdit(row.id)} size="small">
                  <EditOutlinedIcon fontSize="small" />
                </IconButton>
                <IconButton aria-label="Delete" onClick={() => void handleDelete(row.id)} size="small">
                  <DeleteOutlinedIcon fontSize="small" />
                </IconButton>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={dialogOpen} onClose={closeDialog} fullWidth maxWidth="sm">
        <DialogTitle>{editingId == null ? 'Add customer' : 'Edit customer'}</DialogTitle>
        <Box component="form" onSubmit={onSubmit}>
          <DialogContent>
            <Stack spacing={2} sx={{ pt: 1 }}>
              {(
                [
                  ['name', 'Name'],
                  ['companyName', 'Company name'],
                  ['contactPerson', 'Contact person'],
                  ['email', 'Email'],
                  ['phone', 'Phone'],
                  ['taxNumber', 'Tax number'],
                  ['address', 'Address'],
                  ['billingAddress', 'Billing address'],
                  ['shippingAddress', 'Shipping address']
                ] as const
              ).map(([field, label]) => (
                <Controller
                  key={field}
                  name={field}
                  control={form.control}
                  render={({ field: controlField, fieldState }) => (
                    <TextField
                      {...controlField}
                      label={label}
                      value={controlField.value ?? ''}
                      error={Boolean(fieldState.error)}
                      helperText={fieldState.error?.message}
                      fullWidth
                      multiline={
                        field === 'address' ||
                        field === 'billingAddress' ||
                        field === 'shippingAddress'
                      }
                      minRows={
                        field === 'address' ||
                        field === 'billingAddress' ||
                        field === 'shippingAddress'
                          ? 2
                          : undefined
                      }
                    />
                  )}
                />
              ))}
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={closeDialog}>Cancel</Button>
            <Button type="submit" variant="contained">
              Save
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
    </Stack>
  )
}
