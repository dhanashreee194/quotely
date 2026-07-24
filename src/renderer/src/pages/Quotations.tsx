import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import IconButton from '@mui/material/IconButton'
import MenuItem from '@mui/material/MenuItem'
import Stack from '@mui/material/Stack'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import AddIcon from '@mui/icons-material/Add'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import HistoryIcon from '@mui/icons-material/History'
import { QUOTATION_STATUSES } from '../../../shared/quotation'
import type { QuotationListItem, QuotationStatus } from '../../../shared/types'
import { useQuotationsStore } from '../stores/quotationsStore'

export default function QuotationsPage(): React.JSX.Element {
  const navigate = useNavigate()
  const { search, setSearch } = useQuotationsStore()
  const [rows, setRows] = useState<QuotationListItem[]>([])
  const [error, setError] = useState('')

  const load = useCallback(async (): Promise<void> => {
    try {
      setRows(await window.api.quotations.list(search))
      setError('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load quotations')
    }
  }, [search])

  useEffect(() => {
    void load()
  }, [load])

  return (
    <Stack spacing={2}>
      <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4">Quotations</Typography>
          <Typography color="text.secondary">
            Create, finalize, duplicate, and revise customer quotations.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate('/quotations/new')}
        >
          New quotation
        </Button>
      </Stack>

      <TextField
        size="small"
        label="Search"
        placeholder="Number, customer, or status"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        sx={{ maxWidth: 360 }}
      />

      {error && <Alert severity="error">{error}</Alert>}

      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Number</TableCell>
            <TableCell>Date</TableCell>
            <TableCell>Customer</TableCell>
            <TableCell>Template</TableCell>
            <TableCell>Status</TableCell>
            <TableCell align="right">Grand total</TableCell>
            <TableCell align="right">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.length === 0 && (
            <TableRow>
              <TableCell colSpan={7}>
                <Typography color="text.secondary">No quotations yet.</Typography>
              </TableCell>
            </TableRow>
          )}
          {rows.map((row) => (
            <TableRow key={row.id} hover>
              <TableCell>
                <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                  <span>{row.quotationNumber}</span>
                  {row.revisionNumber > 0 && (
                    <Chip size="small" label={`R${row.revisionNumber}`} />
                  )}
                </Stack>
              </TableCell>
              <TableCell>{row.date.slice(0, 10)}</TableCell>
              <TableCell>{row.customerName ?? '—'}</TableCell>
              <TableCell>{row.templateName ?? '—'}</TableCell>
              <TableCell>
                <TextField
                  select
                  size="small"
                  value={row.status}
                  onChange={(event) => {
                    void window.api.quotations
                      .setStatus(row.id, event.target.value as QuotationStatus)
                      .then(load)
                      .catch((err: unknown) =>
                        setError(err instanceof Error ? err.message : 'Status update failed')
                      )
                  }}
                  sx={{ minWidth: 140 }}
                >
                  {QUOTATION_STATUSES.map((status) => (
                    <MenuItem key={status} value={status}>
                      {status}
                    </MenuItem>
                  ))}
                </TextField>
              </TableCell>
              <TableCell align="right">{row.grandTotal.toFixed(2)}</TableCell>
              <TableCell align="right">
                <IconButton
                  aria-label="Edit"
                  size="small"
                  onClick={() => navigate(`/quotations/${row.id}`)}
                >
                  <EditOutlinedIcon fontSize="small" />
                </IconButton>
                <IconButton
                  aria-label="Duplicate"
                  size="small"
                  onClick={() => {
                    void window.api.quotations
                      .duplicate(row.id)
                      .then((copy) => navigate(`/quotations/${copy.id}`))
                      .catch((err: unknown) =>
                        setError(err instanceof Error ? err.message : 'Duplicate failed')
                      )
                  }}
                >
                  <ContentCopyIcon fontSize="small" />
                </IconButton>
                <IconButton
                  aria-label="Revise"
                  size="small"
                  onClick={() => {
                    void window.api.quotations
                      .revise(row.id)
                      .then((revision) => navigate(`/quotations/${revision.id}`))
                      .catch((err: unknown) =>
                        setError(err instanceof Error ? err.message : 'Revise failed')
                      )
                  }}
                >
                  <HistoryIcon fontSize="small" />
                </IconButton>
                <IconButton
                  aria-label="Delete"
                  size="small"
                  onClick={() => {
                    if (!window.confirm('Delete this quotation?')) return
                    void window.api.quotations
                      .remove(row.id)
                      .then(load)
                      .catch((err: unknown) =>
                        setError(err instanceof Error ? err.message : 'Delete failed')
                      )
                  }}
                >
                  <DeleteOutlinedIcon fontSize="small" />
                </IconButton>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Stack>
  )
}
