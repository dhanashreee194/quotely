import { useCallback, useEffect, useState } from 'react'
import Alert from '@mui/material/Alert'
import MenuItem from '@mui/material/MenuItem'
import Stack from '@mui/material/Stack'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import type { AuditLogEntry } from '../../../shared/dataManagement'

export default function AuditPanel(): React.JSX.Element {
  const [rows, setRows] = useState<AuditLogEntry[]>([])
  const [actions, setActions] = useState<string[]>([])
  const [action, setAction] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [error, setError] = useState('')

  const load = useCallback(async (): Promise<void> => {
    try {
      const [entries, actionList] = await Promise.all([
        window.api.audit.list({
          action: action || undefined,
          dateFrom: dateFrom || undefined,
          dateTo: dateTo || undefined
        }),
        window.api.audit.actions()
      ])
      setRows(entries)
      setActions(actionList)
      setError('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load audit log')
    }
  }, [action, dateFrom, dateTo])

  useEffect(() => {
    void load()
  }, [load])

  return (
    <Stack spacing={2}>
      <Typography variant="h6">Audit log</Typography>
      <Typography color="text.secondary">
        Read-only history of create, edit, finalize, revise, delete, status, template, backup, and
        restore events.
      </Typography>

      <Stack direction="row" spacing={1.5} useFlexGap sx={{ flexWrap: 'wrap' }}>
        <TextField
          select
          size="small"
          label="Action"
          value={action}
          onChange={(event) => setAction(event.target.value)}
          sx={{ flex: '1 1 160px', minWidth: 0, maxWidth: { sm: 240 } }}
        >
          <MenuItem value="">All actions</MenuItem>
          {actions.map((item) => (
            <MenuItem key={item} value={item}>
              {item}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          size="small"
          type="date"
          label="From"
          value={dateFrom}
          onChange={(event) => setDateFrom(event.target.value)}
          slotProps={{ inputLabel: { shrink: true } }}
          sx={{ flex: '1 1 140px', minWidth: 0 }}
        />
        <TextField
          size="small"
          type="date"
          label="To"
          value={dateTo}
          onChange={(event) => setDateTo(event.target.value)}
          slotProps={{ inputLabel: { shrink: true } }}
          sx={{ flex: '1 1 140px', minWidth: 0 }}
        />
      </Stack>

      {error && <Alert severity="error">{error}</Alert>}

      <TableContainer sx={{ overflowX: 'auto' }}>
        <Table size="small" sx={{ minWidth: 560 }}>
          <TableHead>
            <TableRow>
              <TableCell>When</TableCell>
              <TableCell>User</TableCell>
              <TableCell>Action</TableCell>
              <TableCell>Entity</TableCell>
              <TableCell>Entity id</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={5}>
                  <Typography color="text.secondary">No audit entries yet.</Typography>
                </TableCell>
              </TableRow>
            )}
            {rows.map((row) => (
              <TableRow key={row.id} hover>
                <TableCell>{row.datetime.replace('T', ' ').slice(0, 19)}</TableCell>
                <TableCell>{row.user ?? '—'}</TableCell>
                <TableCell>{row.action}</TableCell>
                <TableCell>{row.entityType}</TableCell>
                <TableCell>{row.entityId ?? '—'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Stack>
  )
}
