import { useState } from 'react'
import Alert from '@mui/material/Alert'
import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import BackupOutlinedIcon from '@mui/icons-material/BackupOutlined'
import RestoreOutlinedIcon from '@mui/icons-material/RestoreOutlined'
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined'

export default function BackupRestorePanel(): React.JSX.Element {
  const [busy, setBusy] = useState<'backup' | 'restore' | 'csv' | null>(null)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const handleBackup = async (): Promise<void> => {
    setBusy('backup')
    setError('')
    setMessage('')
    try {
      const result = await window.api.backup.create()
      if (result?.path) {
        setMessage(`Backup saved to ${result.path}`)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Backup failed')
    } finally {
      setBusy(null)
    }
  }

  const handleRestore = async (): Promise<void> => {
    setError('')
    setMessage('')
    try {
      const zipPath = await window.api.backup.pick()
      if (!zipPath) return

      const confirmed = window.confirm(
        'Restore will overwrite the current database and assets with the selected backup.\n\n' +
          'A safety backup of your current data will be created first.\n\nContinue?'
      )
      if (!confirmed) return

      setBusy('restore')
      const result = await window.api.backup.restore(zipPath)
      setMessage(
        `Restore complete. Integrity check: ${result.integrityCheck}. Safety backup: ${result.safetyBackupPath}`
      )
      window.setTimeout(() => {
        window.location.reload()
      }, 800)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Restore failed')
    } finally {
      setBusy(null)
    }
  }

  const handleCsv = async (kind: 'quotations' | 'customers' | 'products'): Promise<void> => {
    setBusy('csv')
    setError('')
    setMessage('')
    try {
      const path = await window.api.export.csv(kind)
      if (path) setMessage(`CSV exported to ${path}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'CSV export failed')
    } finally {
      setBusy(null)
    }
  }

  return (
    <Stack spacing={2} sx={{ width: '100%', maxWidth: 720 }}>
      <Typography variant="h6">Backup & restore</Typography>
      <Typography color="text.secondary">
        Create offline zip backups of the database and assets, or restore from a previous backup.
      </Typography>

      {error && <Alert severity="error">{error}</Alert>}
      {message && <Alert severity="success">{message}</Alert>}

      <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap' }}>
        <Button
          variant="contained"
          startIcon={<BackupOutlinedIcon />}
          disabled={busy != null}
          onClick={() => void handleBackup()}
        >
          {busy === 'backup' ? 'Creating…' : 'Create backup'}
        </Button>
        <Button
          variant="outlined"
          color="warning"
          startIcon={<RestoreOutlinedIcon />}
          disabled={busy != null}
          onClick={() => void handleRestore()}
        >
          {busy === 'restore' ? 'Restoring…' : 'Restore backup'}
        </Button>
      </Stack>

      <Typography variant="subtitle1" sx={{ pt: 1 }}>
        CSV export
      </Typography>
      <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap' }}>
        <Button
          variant="outlined"
          startIcon={<FileDownloadOutlinedIcon />}
          disabled={busy != null}
          onClick={() => void handleCsv('quotations')}
        >
          Quotations
        </Button>
        <Button
          variant="outlined"
          startIcon={<FileDownloadOutlinedIcon />}
          disabled={busy != null}
          onClick={() => void handleCsv('customers')}
        >
          Customers
        </Button>
        <Button
          variant="outlined"
          startIcon={<FileDownloadOutlinedIcon />}
          disabled={busy != null}
          onClick={() => void handleCsv('products')}
        >
          Products
        </Button>
      </Stack>
    </Stack>
  )
}
