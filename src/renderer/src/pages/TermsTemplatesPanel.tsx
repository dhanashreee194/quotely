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
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward'
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward'
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import type { TermsTemplate } from '../../../shared/types'
import { termsFormSchema, type TermsFormValues } from '../lib/validation'
import { useTermsTemplatesStore } from '../stores/termsTemplatesStore'

const emptyValues: TermsFormValues = {
  title: '',
  body: ''
}

export default function TermsTemplatesPanel(): React.JSX.Element {
  const { dialogOpen, editingId, openCreate, openEdit, closeDialog } = useTermsTemplatesStore()
  const [rows, setRows] = useState<TermsTemplate[]>([])
  const [error, setError] = useState('')

  const form = useForm<TermsFormValues>({
    resolver: zodResolver(termsFormSchema),
    defaultValues: emptyValues
  })

  const load = useCallback(async (): Promise<void> => {
    try {
      setRows(await window.api.termsTemplates.list())
      setError('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load templates')
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    if (!dialogOpen) return
    if (editingId == null) {
      form.reset(emptyValues)
      return
    }
    const current = rows.find((row) => row.id === editingId)
    if (current) {
      form.reset({ title: current.title, body: current.body })
    }
  }, [dialogOpen, editingId, form, rows])

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      if (editingId == null) {
        await window.api.termsTemplates.create(values)
      } else {
        await window.api.termsTemplates.update(editingId, values)
      }
      closeDialog()
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save template')
    }
  })

  const handleDelete = async (id: number): Promise<void> => {
    if (!window.confirm('Delete this template?')) return
    try {
      await window.api.termsTemplates.remove(id)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete template')
    }
  }

  const handleReorder = async (id: number, direction: 'up' | 'down'): Promise<void> => {
    try {
      setRows(await window.api.termsTemplates.reorder(id, direction))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reorder template')
    }
  }

  return (
    <Stack spacing={2}>
      <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h6">Terms & conditions</Typography>
          <Typography color="text.secondary">
            Reusable terms text. Use arrows to set display order.
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
          Add template
        </Button>
      </Stack>

      {error && <Alert severity="error">{error}</Alert>}

      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell width={72}>Order</TableCell>
            <TableCell>Title</TableCell>
            <TableCell>Body</TableCell>
            <TableCell align="right">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.length === 0 && (
            <TableRow>
              <TableCell colSpan={4}>
                <Typography color="text.secondary">No templates yet.</Typography>
              </TableCell>
            </TableRow>
          )}
          {rows.map((row, index) => (
            <TableRow key={row.id} hover>
              <TableCell>{index + 1}</TableCell>
              <TableCell>{row.title}</TableCell>
              <TableCell sx={{ maxWidth: 420 }}>
                <Typography noWrap color="text.secondary">
                  {row.body}
                </Typography>
              </TableCell>
              <TableCell align="right">
                <IconButton
                  aria-label="Move up"
                  size="small"
                  disabled={index === 0}
                  onClick={() => void handleReorder(row.id, 'up')}
                >
                  <ArrowUpwardIcon fontSize="small" />
                </IconButton>
                <IconButton
                  aria-label="Move down"
                  size="small"
                  disabled={index === rows.length - 1}
                  onClick={() => void handleReorder(row.id, 'down')}
                >
                  <ArrowDownwardIcon fontSize="small" />
                </IconButton>
                <IconButton aria-label="Edit" size="small" onClick={() => openEdit(row.id)}>
                  <EditOutlinedIcon fontSize="small" />
                </IconButton>
                <IconButton aria-label="Delete" size="small" onClick={() => void handleDelete(row.id)}>
                  <DeleteOutlinedIcon fontSize="small" />
                </IconButton>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={dialogOpen} onClose={closeDialog} fullWidth maxWidth="sm">
        <DialogTitle>{editingId == null ? 'Add template' : 'Edit template'}</DialogTitle>
        <Box component="form" onSubmit={onSubmit}>
          <DialogContent>
            <Stack spacing={2} sx={{ pt: 1 }}>
              <Controller
                name="title"
                control={form.control}
                render={({ field, fieldState }) => (
                  <TextField
                    {...field}
                    label="Title"
                    error={Boolean(fieldState.error)}
                    helperText={fieldState.error?.message}
                    fullWidth
                  />
                )}
              />
              <Controller
                name="body"
                control={form.control}
                render={({ field, fieldState }) => (
                  <TextField
                    {...field}
                    label="Body"
                    error={Boolean(fieldState.error)}
                    helperText={fieldState.error?.message}
                    fullWidth
                    multiline
                    minRows={6}
                  />
                )}
              />
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
