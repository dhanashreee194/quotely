import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Alert from '@mui/material/Alert'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
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
import useMediaQuery from '@mui/material/useMediaQuery'
import { useTheme } from '@mui/material/styles'
import PageShell from '../layout/PageShell'
import AddIcon from '@mui/icons-material/Add'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined'
import HistoryIcon from '@mui/icons-material/History'
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf'
import PrintIcon from '@mui/icons-material/Print'
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined'
import { QUOTATION_STATUSES } from '../../../shared/quotation'
import type { Customer, QuotationListItem, QuotationStatus } from '../../../shared/types'
import { useQuotationsStore } from '../stores/quotationsStore'

const SEARCH_DEBOUNCE_MS = 300

/** UXPin-style pipeline chips mapped onto Quotely statuses. */
const STATUS_PIPELINE: Array<{
  label: string
  status: QuotationStatus
  bg: string
  color: string
}> = [
  { label: 'Open', status: 'Draft', bg: '#F6E27A', color: '#5C4B00' },
  { label: 'Sent', status: 'Sent', bg: '#F4A261', color: '#5C2E00' },
  { label: 'Done', status: 'Accepted', bg: '#2E9E5B', color: '#FFFFFF' },
  { label: 'Rejected', status: 'Rejected', bg: '#E35D6A', color: '#FFFFFF' }
]

export default function QuotationsPage(): React.JSX.Element {
  const navigate = useNavigate()
  const theme = useTheme()
  const showSecondaryCols = useMediaQuery(theme.breakpoints.up('md'))
  const {

    search,
    customerId,
    status,
    dateFrom,
    dateTo,
    amountMin,
    amountMax,
    setSearch,
    setCustomerId,
    setStatus,
    setDateFrom,
    setDateTo,
    setAmountMin,
    setAmountMax,
    resetFilters,
    toFilters
  } = useQuotationsStore()

  const [rows, setRows] = useState<QuotationListItem[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [error, setError] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState(search)

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search), SEARCH_DEBOUNCE_MS)
    return () => window.clearTimeout(timer)
  }, [search])

  useEffect(() => {
    void window.api.customers.list().then(setCustomers).catch(() => setCustomers([]))
  }, [])

  const load = useCallback(async (): Promise<void> => {
    try {
      const filters = toFilters()
      filters.search = debouncedSearch.trim() || undefined
      setRows(await window.api.quotations.list(filters))
      setError('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load quotations')
    }
  }, [debouncedSearch, toFilters, customerId, status, dateFrom, dateTo, amountMin, amountMax])

  useEffect(() => {
    void load()
  }, [load])

  const filterFieldSx = { flex: '1 1 160px', minWidth: 0, maxWidth: { sm: 280 } }

  return (
    <PageShell
      title="Quotations"
      subtitle="Create, finalize, duplicate, and revise customer quotations."
      actions={
        <>
          <Button
            variant="outlined"
            startIcon={<FileDownloadOutlinedIcon />}
            onClick={() => {
              void window.api.export
                .csv('quotations')
                .catch((err: unknown) =>
                  setError(err instanceof Error ? err.message : 'CSV export failed')
                )
            }}
          >
            Export CSV
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate('/quotations/new')}
          >
            New quotation
          </Button>
        </>
      }
    >
      <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap', justifyContent: 'center' }}>
        {STATUS_PIPELINE.map((tab) => {
          const active = status === tab.status
          return (
            <Button
              key={tab.label}
              onClick={() => setStatus(active ? '' : tab.status)}
              sx={{
                minWidth: 100,
                borderRadius: 999,
                px: 2.5,
                py: 0.75,
                fontWeight: 700,
                bgcolor: tab.bg,
                color: tab.color,
                opacity: status && !active ? 0.55 : 1,
                boxShadow: active ? '0 0 0 2px rgba(27,77,62,0.35)' : 'none',
                '&:hover': { bgcolor: tab.bg, filter: 'brightness(0.97)' }
              }}
            >
              {tab.label}
            </Button>
          )
        })}
      </Stack>

      <Paper variant="outlined" sx={{ p: 2 }}>
        <Stack spacing={2}>
          <Typography variant="subtitle1">Filters</Typography>
          <Stack direction="row" spacing={1.5} useFlexGap sx={{ flexWrap: 'wrap' }}>
            <TextField
              size="small"
              label="Quotation number"
              placeholder="QT-2026…"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              sx={filterFieldSx}
            />
            <TextField
              select
              size="small"
              label="Customer"
              value={customerId === '' ? '' : String(customerId)}
              onChange={(event) =>
                setCustomerId(event.target.value === '' ? '' : Number(event.target.value))
              }
              sx={filterFieldSx}
            >
              <MenuItem value="">All customers</MenuItem>
              {customers.map((customer) => (
                <MenuItem key={customer.id} value={String(customer.id)}>
                  {customer.name}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              size="small"
              label="Status"
              value={status}
              onChange={(event) => setStatus(event.target.value as QuotationStatus | '')}
              sx={filterFieldSx}
            >
              <MenuItem value="">All statuses</MenuItem>
              {QUOTATION_STATUSES.map((item) => (
                <MenuItem key={item} value={item}>
                  {item}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              size="small"
              type="date"
              label="From date"
              value={dateFrom}
              onChange={(event) => setDateFrom(event.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
              sx={filterFieldSx}
            />
            <TextField
              size="small"
              type="date"
              label="To date"
              value={dateTo}
              onChange={(event) => setDateTo(event.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
              sx={filterFieldSx}
            />
            <TextField
              size="small"
              type="number"
              label="Min amount"
              value={amountMin}
              onChange={(event) => setAmountMin(event.target.value)}
              sx={filterFieldSx}
            />
            <TextField
              size="small"
              type="number"
              label="Max amount"
              value={amountMax}
              onChange={(event) => setAmountMax(event.target.value)}
              sx={filterFieldSx}
            />
            <Button onClick={resetFilters} sx={{ alignSelf: 'center' }}>
              Clear
            </Button>
          </Stack>
        </Stack>
      </Paper>

      {error && <Alert severity="error">{error}</Alert>}

      <TableContainer sx={{ overflowX: 'auto', width: '100%' }}>
        <Table size="small" sx={{ minWidth: showSecondaryCols ? 960 : 720 }}>
          <TableHead>
            <TableRow>
              <TableCell>Number</TableCell>
              <TableCell>Date</TableCell>
              <TableCell>Customer</TableCell>
              {showSecondaryCols && <TableCell>Template</TableCell>}
              <TableCell>Status</TableCell>
              <TableCell align="right">Grand total</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={showSecondaryCols ? 7 : 6}>
                  <Typography color="text.secondary">No quotations match these filters.</Typography>
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
                {showSecondaryCols && <TableCell>{row.templateName ?? '—'}</TableCell>}
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
                    sx={{ minWidth: 120 }}
                  >
                    {QUOTATION_STATUSES.map((item) => (
                      <MenuItem key={item} value={item}>
                        {item}
                      </MenuItem>
                    ))}
                  </TextField>
                </TableCell>
                <TableCell align="right">{row.grandTotal.toFixed(2)}</TableCell>
                <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                  <IconButton
                    aria-label="Edit"
                    size="small"
                    onClick={() => navigate(`/quotations/${row.id}`)}
                  >
                    <EditOutlinedIcon fontSize="small" />
                  </IconButton>
                  <IconButton
                    aria-label="Preview"
                    size="small"
                    onClick={() => navigate(`/quotations/${row.id}/preview`)}
                  >
                    <VisibilityOutlinedIcon fontSize="small" />
                  </IconButton>
                  <IconButton
                    aria-label="Export PDF"
                    size="small"
                    onClick={() => {
                      void window.api.documents
                        .exportPdf(row.id)
                        .catch((err: unknown) =>
                          setError(err instanceof Error ? err.message : 'PDF export failed')
                        )
                    }}
                  >
                    <PictureAsPdfIcon fontSize="small" />
                  </IconButton>
                  <IconButton
                    aria-label="Print"
                    size="small"
                    onClick={() => {
                      void window.api.documents
                        .print(row.id)
                        .catch((err: unknown) =>
                          setError(err instanceof Error ? err.message : 'Print failed')
                        )
                    }}
                  >
                    <PrintIcon fontSize="small" />
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
      </TableContainer>
    </PageShell>
  )
}
