import { useCallback, useEffect, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Checkbox from '@mui/material/Checkbox'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import FormControl from '@mui/material/FormControl'
import FormControlLabel from '@mui/material/FormControlLabel'
import IconButton from '@mui/material/IconButton'
import InputLabel from '@mui/material/InputLabel'
import MenuItem from '@mui/material/MenuItem'
import Select from '@mui/material/Select'
import Stack from '@mui/material/Stack'
import Tab from '@mui/material/Tab'
import Tabs from '@mui/material/Tabs'
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
import type { ChargeRule } from '../../../shared/types'
import {
  chargeRuleFormSchema,
  companyFormSchema,
  type ChargeRuleFormValues,
  type CompanyFormValues
} from '../lib/validation'
import { useSettingsStore, type SettingsTab } from '../stores/settingsStore'
import AuditPanel from './AuditPanel'
import BackupRestorePanel from './BackupRestorePanel'

const emptyCompany: CompanyFormValues = {
  name: '',
  logoPath: '',
  address: '',
  phone: '',
  email: '',
  website: '',
  taxRegNumber: '',
  panNumber: '',
  bankDetails: '',
  authorizedSignatory: '',
  signaturePath: '',
  footer: ''
}

const emptyCharge: ChargeRuleFormValues = {
  name: '',
  type: 'percentage',
  value: 0,
  appliesToSubtotal: true
}

export default function SettingsPage(): React.JSX.Element {
  const {
    tab,
    setTab,
    chargeDialogOpen,
    editingChargeId,
    openChargeCreate,
    openChargeEdit,
    closeChargeDialog
  } = useSettingsStore()

  const [status, setStatus] = useState<'idle' | 'saved' | 'error'>('idle')
  const [error, setError] = useState('')
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [signaturePreview, setSignaturePreview] = useState<string | null>(null)
  const [chargeRules, setChargeRules] = useState<ChargeRule[]>([])

  const companyForm = useForm<CompanyFormValues>({
    resolver: zodResolver(companyFormSchema),
    defaultValues: emptyCompany
  })

  const chargeForm = useForm<ChargeRuleFormValues>({
    resolver: zodResolver(chargeRuleFormSchema),
    defaultValues: emptyCharge
  })

  const loadPreviews = useCallback(async (logoPath?: string | null, signaturePath?: string | null) => {
    if (logoPath) {
      setLogoPreview(await window.api.assets.getDataUrl(logoPath))
    } else {
      setLogoPreview(null)
    }
    if (signaturePath) {
      setSignaturePreview(await window.api.assets.getDataUrl(signaturePath))
    } else {
      setSignaturePreview(null)
    }
  }, [])

  const loadCompany = useCallback(async (): Promise<void> => {
    try {
      const profile = await window.api.company.get()
      if (!profile) {
        companyForm.reset(emptyCompany)
        setLogoPreview(null)
        setSignaturePreview(null)
        return
      }
      companyForm.reset({
        name: profile.name,
        logoPath: profile.logoPath ?? '',
        address: profile.address ?? '',
        phone: profile.phone ?? '',
        email: profile.email ?? '',
        website: profile.website ?? '',
        taxRegNumber: profile.taxRegNumber ?? '',
        panNumber: profile.panNumber ?? '',
        bankDetails: profile.bankDetails ?? '',
        authorizedSignatory: profile.authorizedSignatory ?? '',
        signaturePath: profile.signaturePath ?? '',
        footer: profile.footer ?? ''
      })
      await loadPreviews(profile.logoPath, profile.signaturePath)
      setError('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load company profile')
    }
  }, [companyForm, loadPreviews])

  const loadChargeRules = useCallback(async (): Promise<void> => {
    try {
      setChargeRules(await window.api.chargeRules.list())
      setError('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load charge rules')
    }
  }, [])

  useEffect(() => {
    void loadCompany()
    void loadChargeRules()
  }, [loadCompany, loadChargeRules])

  useEffect(() => {
    if (!chargeDialogOpen) return
    if (editingChargeId == null) {
      chargeForm.reset(emptyCharge)
      return
    }
    const current = chargeRules.find((rule) => rule.id === editingChargeId)
    if (current) {
      chargeForm.reset({
        name: current.name,
        type: current.type,
        value: current.value,
        appliesToSubtotal: current.appliesToSubtotal
      })
    }
  }, [chargeDialogOpen, editingChargeId, chargeForm, chargeRules])

  const pickImage = async (kind: 'logo' | 'signature'): Promise<void> => {
    try {
      const relativePath = await window.api.assets.pickImage(kind)
      if (!relativePath) return
      if (kind === 'logo') {
        companyForm.setValue('logoPath', relativePath, { shouldDirty: true })
        setLogoPreview(await window.api.assets.getDataUrl(relativePath))
      } else {
        companyForm.setValue('signaturePath', relativePath, { shouldDirty: true })
        setSignaturePreview(await window.api.assets.getDataUrl(relativePath))
      }
      setStatus('idle')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to pick image')
      setStatus('error')
    }
  }

  const onSaveCompany = companyForm.handleSubmit(async (values) => {
    try {
      await window.api.company.upsert({
        ...values,
        logoPath: values.logoPath || null,
        signaturePath: values.signaturePath || null
      })
      setStatus('saved')
      setError('')
      await loadCompany()
    } catch (err) {
      setStatus('error')
      setError(err instanceof Error ? err.message : 'Failed to save company profile')
    }
  })

  const onSaveCharge = chargeForm.handleSubmit(async (values) => {
    try {
      if (editingChargeId == null) {
        await window.api.chargeRules.create(values)
      } else {
        await window.api.chargeRules.update(editingChargeId, values)
      }
      closeChargeDialog()
      await loadChargeRules()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save charge rule')
    }
  })

  const handleDeleteCharge = async (id: number): Promise<void> => {
    if (!window.confirm('Delete this rule?')) return
    try {
      await window.api.chargeRules.remove(id)
      await loadChargeRules()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete charge rule')
    }
  }

  return (
    <Stack spacing={2}>
      <Box>
        <Typography variant="h4">Settings</Typography>
        <Typography color="text.secondary">
          Company profile, tax rules, backup, and audit history.
        </Typography>
      </Box>

      <Tabs value={tab} onChange={(_event, value: SettingsTab) => setTab(value)}>
        <Tab label="Company" value="company" />
        <Tab label="Tax & charges" value="charges" />
        <Tab label="Backup & Restore" value="backup" />
        <Tab label="Audit" value="audit" />
      </Tabs>

      {error && <Alert severity="error">{error}</Alert>}

      {tab === 'backup' && <BackupRestorePanel />}
      {tab === 'audit' && <AuditPanel />}

      {tab === 'company' && (
        <Box component="form" onSubmit={onSaveCompany} sx={{ maxWidth: 720 }}>
          <Stack spacing={2}>
            <Controller
              name="name"
              control={companyForm.control}
              render={({ field, fieldState }) => (
                <TextField
                  {...field}
                  label="Company name"
                  error={Boolean(fieldState.error)}
                  helperText={fieldState.error?.message}
                  fullWidth
                />
              )}
            />

            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={2}
              sx={{ alignItems: 'flex-start' }}
            >
              <Stack spacing={1} sx={{ minWidth: 180 }}>
                <Typography variant="subtitle2">Logo</Typography>
                {logoPreview ? (
                  <Box
                    component="img"
                    src={logoPreview}
                    alt="Company logo"
                    sx={{ width: 140, height: 140, objectFit: 'contain', border: 1, borderColor: 'divider' }}
                  />
                ) : (
                  <Box
                    sx={{
                      width: 140,
                      height: 140,
                      border: 1,
                      borderColor: 'divider',
                      display: 'grid',
                      placeItems: 'center'
                    }}
                  >
                    <Typography color="text.secondary" variant="body2">
                      No logo
                    </Typography>
                  </Box>
                )}
                <Button variant="outlined" onClick={() => void pickImage('logo')}>
                  Upload logo
                </Button>
              </Stack>

              <Stack spacing={1} sx={{ minWidth: 180 }}>
                <Typography variant="subtitle2">Signature</Typography>
                {signaturePreview ? (
                  <Box
                    component="img"
                    src={signaturePreview}
                    alt="Signature"
                    sx={{ width: 140, height: 140, objectFit: 'contain', border: 1, borderColor: 'divider' }}
                  />
                ) : (
                  <Box
                    sx={{
                      width: 140,
                      height: 140,
                      border: 1,
                      borderColor: 'divider',
                      display: 'grid',
                      placeItems: 'center'
                    }}
                  >
                    <Typography color="text.secondary" variant="body2">
                      No signature
                    </Typography>
                  </Box>
                )}
                <Button variant="outlined" onClick={() => void pickImage('signature')}>
                  Upload signature
                </Button>
              </Stack>
            </Stack>

            {(
              [
                ['email', 'Email'],
                ['phone', 'Phone'],
                ['website', 'Website'],
                ['taxRegNumber', 'Tax registration number'],
                ['panNumber', 'PAN number'],
                ['authorizedSignatory', 'Authorized signatory']
              ] as const
            ).map(([name, label]) => (
              <Controller
                key={name}
                name={name}
                control={companyForm.control}
                render={({ field, fieldState }) => (
                  <TextField
                    {...field}
                    value={field.value ?? ''}
                    label={label}
                    error={Boolean(fieldState.error)}
                    helperText={fieldState.error?.message}
                    fullWidth
                  />
                )}
              />
            ))}

            <Controller
              name="address"
              control={companyForm.control}
              render={({ field, fieldState }) => (
                <TextField
                  {...field}
                  value={field.value ?? ''}
                  label="Address"
                  error={Boolean(fieldState.error)}
                  helperText={fieldState.error?.message}
                  fullWidth
                  multiline
                  minRows={2}
                />
              )}
            />
            <Controller
              name="bankDetails"
              control={companyForm.control}
              render={({ field, fieldState }) => (
                <TextField
                  {...field}
                  value={field.value ?? ''}
                  label="Bank details"
                  error={Boolean(fieldState.error)}
                  helperText={fieldState.error?.message}
                  fullWidth
                  multiline
                  minRows={2}
                />
              )}
            />
            <Controller
              name="footer"
              control={companyForm.control}
              render={({ field, fieldState }) => (
                <TextField
                  {...field}
                  value={field.value ?? ''}
                  label="Footer"
                  error={Boolean(fieldState.error)}
                  helperText={fieldState.error?.message}
                  fullWidth
                  multiline
                  minRows={2}
                />
              )}
            />

            <Button type="submit" variant="contained" sx={{ alignSelf: 'flex-start' }}>
              Save company profile
            </Button>
            {status === 'saved' && <Alert severity="success">Company profile saved.</Alert>}
          </Stack>
        </Box>
      )}

      {tab === 'charges' && (
        <Stack spacing={2}>
          <Stack direction="row" sx={{ justifyContent: 'flex-end' }}>
            <Button variant="contained" startIcon={<AddIcon />} onClick={openChargeCreate}>
              Add rule
            </Button>
          </Stack>

          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Type</TableCell>
                <TableCell align="right">Value</TableCell>
                <TableCell>Applies to subtotal</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {chargeRules.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5}>
                    <Typography color="text.secondary">No tax or charge rules yet.</Typography>
                  </TableCell>
                </TableRow>
              )}
              {chargeRules.map((rule) => (
                <TableRow key={rule.id} hover>
                  <TableCell>{rule.name}</TableCell>
                  <TableCell>{rule.type}</TableCell>
                  <TableCell align="right">{rule.value}</TableCell>
                  <TableCell>{rule.appliesToSubtotal ? 'Yes' : 'No'}</TableCell>
                  <TableCell align="right">
                    <IconButton aria-label="Edit" size="small" onClick={() => openChargeEdit(rule.id)}>
                      <EditOutlinedIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      aria-label="Delete"
                      size="small"
                      onClick={() => void handleDeleteCharge(rule.id)}
                    >
                      <DeleteOutlinedIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Stack>
      )}

      <Dialog open={chargeDialogOpen} onClose={closeChargeDialog} fullWidth maxWidth="xs">
        <DialogTitle>{editingChargeId == null ? 'Add rule' : 'Edit rule'}</DialogTitle>
        <Box component="form" onSubmit={onSaveCharge}>
          <DialogContent>
            <Stack spacing={2} sx={{ pt: 1 }}>
              <Controller
                name="name"
                control={chargeForm.control}
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
                name="type"
                control={chargeForm.control}
                render={({ field, fieldState }) => (
                  <FormControl fullWidth error={Boolean(fieldState.error)}>
                    <InputLabel id="charge-type-label">Type</InputLabel>
                    <Select {...field} labelId="charge-type-label" label="Type">
                      <MenuItem value="percentage">Percentage</MenuItem>
                      <MenuItem value="fixed">Fixed</MenuItem>
                    </Select>
                  </FormControl>
                )}
              />
              <Controller
                name="value"
                control={chargeForm.control}
                render={({ field, fieldState }) => (
                  <TextField
                    name={field.name}
                    ref={field.ref}
                    onBlur={field.onBlur}
                    value={field.value}
                    onChange={(event) => field.onChange(Number(event.target.value))}
                    type="number"
                    label="Value"
                    error={Boolean(fieldState.error)}
                    helperText={fieldState.error?.message}
                    fullWidth
                  />
                )}
              />
              <Controller
                name="appliesToSubtotal"
                control={chargeForm.control}
                render={({ field }) => (
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={field.value}
                        onChange={(event) => field.onChange(event.target.checked)}
                      />
                    }
                    label="Applies to subtotal"
                  />
                )}
              />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={closeChargeDialog}>Cancel</Button>
            <Button type="submit" variant="contained">
              Save
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
    </Stack>
  )
}
