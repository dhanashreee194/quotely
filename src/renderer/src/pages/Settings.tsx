import { useEffect, useState } from 'react'
import Alert from '@mui/material/Alert'
import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'

const COMPANY_NAME_KEY = 'companyName'

export default function SettingsPage(): React.JSX.Element {
  const [companyName, setCompanyName] = useState('')
  const [status, setStatus] = useState<'idle' | 'saved' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    void window.api.settings
      .get(COMPANY_NAME_KEY)
      .then((value) => {
        setCompanyName(value ?? '')
      })
      .catch((error: unknown) => {
        setStatus('error')
        setErrorMessage(error instanceof Error ? error.message : 'Failed to load settings')
      })
  }, [])

  const handleSave = async (): Promise<void> => {
    try {
      await window.api.settings.set(COMPANY_NAME_KEY, companyName)
      setStatus('saved')
      setErrorMessage('')
    } catch (error: unknown) {
      setStatus('error')
      setErrorMessage(error instanceof Error ? error.message : 'Failed to save settings')
    }
  }

  return (
    <Stack spacing={2} sx={{ maxWidth: 480 }}>
      <Typography variant="h4">Settings</Typography>
      <Typography color="text.secondary">
        Values are stored in SQLite via IPC and persist across restarts.
      </Typography>

      <TextField
        label="Company name"
        value={companyName}
        onChange={(event) => {
          setCompanyName(event.target.value)
          setStatus('idle')
        }}
        fullWidth
      />

      <Button variant="contained" onClick={() => void handleSave()} sx={{ alignSelf: 'flex-start' }}>
        Save
      </Button>

      {status === 'saved' && <Alert severity="success">Saved. Restart the app to confirm persistence.</Alert>}
      {status === 'error' && <Alert severity="error">{errorMessage}</Alert>}
    </Stack>
  )
}
