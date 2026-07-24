import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Typography from '@mui/material/Typography'
import Grid from '@mui/material/Grid'
import AddBusinessOutlinedIcon from '@mui/icons-material/AddBusinessOutlined'
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined'
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined'
import DraftsOutlinedIcon from '@mui/icons-material/DraftsOutlined'
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined'
import PeopleAltOutlinedIcon from '@mui/icons-material/PeopleAltOutlined'
import RequestQuoteOutlinedIcon from '@mui/icons-material/RequestQuoteOutlined'
import TodayOutlinedIcon from '@mui/icons-material/TodayOutlined'
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined'
import VerifiedOutlinedIcon from '@mui/icons-material/VerifiedOutlined'
import PaymentsOutlinedIcon from '@mui/icons-material/PaymentsOutlined'
import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts'
import type { DashboardSummary } from '../../../shared/dashboard'
import { formatMoney, formatRelativeTime } from '../../../shared/format'
import type { QuotationStatus } from '../../../shared/quotation'
import { useCustomersStore } from '../stores/customersStore'
import { useProductsStore } from '../stores/productsStore'
import { useQuotationsStore } from '../stores/quotationsStore'
import theme from '../theme'

const STATUS_COLORS: Record<QuotationStatus, string> = {
  Draft: '#5C6B66',
  Finalized: '#1B4D3E',
  Sent: '#2F6F5E',
  Accepted: '#C45C26',
  Rejected: '#B42318',
  Expired: '#8A9A94',
  Cancelled: '#6B7280',
  Revised: '#3B6D9A'
}

type StatCardProps = {
  label: string
  value: string
  icon: React.ReactNode
  highlight?: boolean
  onClick?: () => void
}

function StatCard({ label, value, icon, highlight, onClick }: StatCardProps): React.JSX.Element {
  return (
    <Paper
      elevation={0}
      onClick={onClick}
      sx={{
        p: 2,
        height: '100%',
        border: '1px solid',
        borderColor: highlight ? 'secondary.main' : 'divider',
        bgcolor: highlight ? 'rgba(196, 92, 38, 0.08)' : 'background.paper',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'border-color 120ms ease, box-shadow 120ms ease',
        '&:hover': onClick
          ? {
              borderColor: highlight ? 'secondary.dark' : 'primary.main',
              boxShadow: '0 1px 4px rgba(26, 36, 33, 0.08)'
            }
          : undefined
      }}
    >
      <Stack direction="row" spacing={1.5} sx={{ alignItems: 'flex-start' }}>
        <Box
          sx={{
            color: highlight ? 'secondary.main' : 'primary.main',
            mt: 0.25,
            display: 'flex'
          }}
        >
          {icon}
        </Box>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="body2" color="text.secondary" noWrap>
            {label}
          </Typography>
          <Typography
            variant="h5"
            sx={{ fontWeight: 700, mt: 0.25, wordBreak: 'break-word', lineHeight: 1.2 }}
          >
            {value}
          </Typography>
        </Box>
      </Stack>
    </Paper>
  )
}

function ChartEmpty({ message }: { message: string }): React.JSX.Element {
  return (
    <Box
      sx={{
        height: 220,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        px: 2
      }}
    >
      <Typography color="text.secondary" align="center">
        {message}
      </Typography>
    </Box>
  )
}

export default function DashboardPage(): React.JSX.Element {
  const navigate = useNavigate()
  const setQuotationStatus = useQuotationsStore((s) => s.setStatus)
  const resetQuotationFilters = useQuotationsStore((s) => s.resetFilters)
  const openCreateCustomer = useCustomersStore((s) => s.openCreate)
  const openCreateProduct = useProductsStore((s) => s.openCreate)

  const [summary, setSummary] = useState<DashboardSummary | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      setSummary(await window.api.dashboard.getSummary())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard')
      setSummary(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const currency = summary?.currency ?? 'INR'
  const locale = typeof navigator !== 'undefined' ? navigator.language : 'en-IN'
  const money = (amount: number): string => formatMoney(amount, currency, locale)

  const goStatus = (status: QuotationStatus): void => {
    resetQuotationFilters()
    setQuotationStatus(status)
    navigate('/quotations')
  }

  const statusChartData = useMemo(
    () => (summary?.byStatus ?? []).filter((row) => row.count > 0),
    [summary]
  )

  const monthHasData = useMemo(
    () => (summary?.byMonth ?? []).some((row) => row.count > 0),
    [summary]
  )

  const total = summary?.counts.total ?? 0

  const quickActionSx = {
    width: '100%',
    height: '100%',
    minHeight: 44,
    justifyContent: 'flex-start',
    alignItems: 'center',
    px: 2,
    py: 1.25,
    textAlign: 'left',
    '& .MuiButton-startIcon': {
      marginRight: 1
    }
  } as const

  return (
    <Stack spacing={2.5}>
      <Box>
        <Typography variant="h4">Dashboard</Typography>
        <Typography color="text.secondary" sx={{ mt: 0.5 }}>
          Overview of quotations, pipeline value, and recent activity.
        </Typography>
      </Box>

      <Grid container spacing={1.5} sx={{ alignItems: 'stretch' }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Button
            variant="contained"
            fullWidth
            startIcon={<RequestQuoteOutlinedIcon />}
            onClick={() => navigate('/quotations/new')}
            sx={quickActionSx}
          >
            New Quotation
          </Button>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Button
            variant="outlined"
            fullWidth
            startIcon={<PeopleAltOutlinedIcon />}
            onClick={() => {
              openCreateCustomer()
              navigate('/customers')
            }}
            sx={quickActionSx}
          >
            New Customer
          </Button>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Button
            variant="outlined"
            fullWidth
            startIcon={<Inventory2OutlinedIcon />}
            onClick={() => {
              openCreateProduct()
              navigate('/products')
            }}
            sx={quickActionSx}
          >
            New Product
          </Button>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Button
            variant="outlined"
            fullWidth
            startIcon={<DescriptionOutlinedIcon />}
            onClick={() => navigate('/templates')}
            sx={quickActionSx}
          >
            Manage Templates
          </Button>
        </Grid>
      </Grid>

      {error && <Alert severity="error">{error}</Alert>}

      <Grid container spacing={1.5}>
        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2 }}>
          <StatCard
            label="Total Quotations"
            value={loading ? '—' : String(summary?.counts.total ?? 0)}
            icon={<RequestQuoteOutlinedIcon />}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2 }}>
          <StatCard
            label="Created Today"
            value={loading ? '—' : String(summary?.counts.createdToday ?? 0)}
            icon={<TodayOutlinedIcon />}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2 }}>
          <StatCard
            label="This Month"
            value={loading ? '—' : String(summary?.counts.createdThisMonth ?? 0)}
            icon={<CalendarMonthOutlinedIcon />}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2 }}>
          <StatCard
            label="Drafts"
            value={loading ? '—' : String(summary?.counts.drafts ?? 0)}
            icon={<DraftsOutlinedIcon />}
            onClick={() => goStatus('Draft')}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2 }}>
          <StatCard
            label="Finalized"
            value={loading ? '—' : String(summary?.counts.finalized ?? 0)}
            icon={<CheckCircleOutlinedIcon />}
            onClick={() => goStatus('Finalized')}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2 }}>
          <StatCard
            label="Accepted"
            value={loading ? '—' : String(summary?.counts.accepted ?? 0)}
            icon={<VerifiedOutlinedIcon />}
            onClick={() => goStatus('Accepted')}
          />
        </Grid>
        <Grid size={{ xs: 12, lg: 12 }}>
          <StatCard
            label="Total Value (This Month)"
            value={loading ? '—' : money(summary?.totalValueThisMonth ?? 0)}
            icon={<PaymentsOutlinedIcon />}
            highlight
          />
        </Grid>
      </Grid>

      {!loading && total === 0 && (
        <Alert
          severity="info"
          icon={<AddBusinessOutlinedIcon />}
          action={
            <Button color="inherit" size="small" onClick={() => navigate('/quotations/new')}>
              Create quotation
            </Button>
          }
        >
          No quotations yet. Create your first quotation to see stats, charts, and recent activity.
        </Alert>
      )}

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 7 }}>
          <Paper elevation={0} sx={{ p: 2, border: '1px solid', borderColor: 'divider' }}>
            <Typography variant="h6" sx={{ mb: 1 }}>
              Quotations per month
            </Typography>
            {!loading && monthHasData ? (
              <Box sx={{ width: '100%', height: 240 }}>
                <ResponsiveContainer>
                  <BarChart data={summary?.byMonth ?? []} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                    <XAxis dataKey="label" tick={{ fontSize: 12, fill: theme.palette.text.secondary }} />
                    <YAxis
                      allowDecimals={false}
                      tick={{ fontSize: 12, fill: theme.palette.text.secondary }}
                      width={32}
                    />
                    <Tooltip
                      formatter={(value) => [Number(value ?? 0), 'Quotations']}
                      labelStyle={{ color: theme.palette.text.primary }}
                    />
                    <Bar dataKey="count" fill={theme.palette.primary.main} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            ) : (
              <ChartEmpty message="No monthly quotation activity yet." />
            )}
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, md: 5 }}>
          <Paper elevation={0} sx={{ p: 2, border: '1px solid', borderColor: 'divider' }}>
            <Typography variant="h6" sx={{ mb: 1 }}>
              Status breakdown
            </Typography>
            {!loading && statusChartData.length > 0 ? (
              <Box sx={{ width: '100%', height: 240 }}>
                <ResponsiveContainer>
                  <PieChart>
                    <Pie
                      data={statusChartData}
                      dataKey="count"
                      nameKey="status"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={2}
                    >
                      {statusChartData.map((row) => (
                        <Cell key={row.status} fill={STATUS_COLORS[row.status]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [Number(value ?? 0), 'Count']} />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
            ) : (
              <ChartEmpty message="Status mix will appear once you have quotations." />
            )}
            {statusChartData.length > 0 && (
              <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1, mt: 0.5 }}>
                {statusChartData.map((row) => (
                  <Chip
                    key={row.status}
                    size="small"
                    label={`${row.status} · ${row.count}`}
                    sx={{
                      bgcolor: `${STATUS_COLORS[row.status]}22`,
                      color: 'text.primary',
                      borderColor: STATUS_COLORS[row.status]
                    }}
                    variant="outlined"
                  />
                ))}
              </Stack>
            )}
          </Paper>
        </Grid>
      </Grid>

      <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
        <Box sx={{ px: 2, pt: 2, pb: 1 }}>
          <Typography variant="h6">Recent activity</Typography>
          <Typography variant="body2" color="text.secondary">
            Last updated quotations
          </Typography>
        </Box>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Number</TableCell>
              <TableCell>Customer</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Amount</TableCell>
              <TableCell align="right">Updated</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {(summary?.recent.length ?? 0) === 0 && (
              <TableRow>
                <TableCell colSpan={5}>
                  <Typography color="text.secondary" sx={{ py: 2 }}>
                    {loading ? 'Loading…' : 'No recent quotations yet.'}
                  </Typography>
                </TableCell>
              </TableRow>
            )}
            {summary?.recent.map((row) => (
              <TableRow
                key={row.id}
                hover
                sx={{ cursor: 'pointer' }}
                onClick={() => navigate(`/quotations/${row.id}`)}
              >
                <TableCell>{row.quotationNumber}</TableCell>
                <TableCell>{row.customerName ?? '—'}</TableCell>
                <TableCell>
                  <Chip
                    size="small"
                    label={row.status}
                    sx={{
                      bgcolor: `${STATUS_COLORS[row.status]}22`,
                      borderColor: STATUS_COLORS[row.status]
                    }}
                    variant="outlined"
                  />
                </TableCell>
                <TableCell align="right">{money(row.grandTotal)}</TableCell>
                <TableCell align="right">{formatRelativeTime(row.updatedAt)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>

      {summary && total > 0 && (
        <Typography variant="caption" color="text.secondary">
          All-time value: {money(summary.totalValueAllTime)}
        </Typography>
      )}
    </Stack>
  )
}
