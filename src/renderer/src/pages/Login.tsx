import { useState } from 'react'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import logo from '../../../../resources/logo.png'
import { useAuthStore } from '../stores/authStore'

export default function LoginPage(): React.JSX.Element {
  const setUser = useAuthStore((state) => state.setUser)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const handleLogin = async (): Promise<void> => {
    setBusy(true)
    setError('')
    try {
      const user = await window.api.auth.login(username, password)
      setUser(user)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.default',
        p: 2
      }}
    >
      <Paper
        variant="outlined"
        component="form"
        onSubmit={(event) => {
          event.preventDefault()
          void handleLogin()
        }}
        sx={{ p: 4, width: '100%', maxWidth: 380 }}
      >
        <Stack spacing={2.5} sx={{ alignItems: 'center' }}>
          <Box component="img" src={logo} alt="" sx={{ width: 72, height: 72 }} />
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>
              Quotely
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Sign in to continue
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ width: '100%' }}>
              {error}
            </Alert>
          )}

          <TextField
            label="Username"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            autoFocus
            fullWidth
            autoComplete="username"
          />
          <TextField
            label="Password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            fullWidth
            autoComplete="current-password"
          />
          <Button
            type="submit"
            variant="contained"
            fullWidth
            size="large"
            disabled={busy || !username || !password}
          >
            Sign in
          </Button>
        </Stack>
      </Paper>
    </Box>
  )
}
