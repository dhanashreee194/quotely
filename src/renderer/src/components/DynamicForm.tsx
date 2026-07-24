import { useEffect, useMemo } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Checkbox from '@mui/material/Checkbox'
import FormControl from '@mui/material/FormControl'
import FormControlLabel from '@mui/material/FormControlLabel'
import FormHelperText from '@mui/material/FormHelperText'
import FormLabel from '@mui/material/FormLabel'
import InputAdornment from '@mui/material/InputAdornment'
import MenuItem from '@mui/material/MenuItem'
import Radio from '@mui/material/Radio'
import RadioGroup from '@mui/material/RadioGroup'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import type { CustomFieldDefinitionWithOptions } from '../../../shared/types'
import { buildDynamicDefaultValues, buildDynamicZodSchema } from '../lib/dynamicSchema'

type DynamicFormProps = {
  fields: CustomFieldDefinitionWithOptions[]
  submitLabel?: string
  onSubmit?: (values: Record<string, unknown>) => void | Promise<void>
}

export default function DynamicForm({
  fields,
  submitLabel = 'Validate',
  onSubmit
}: DynamicFormProps): React.JSX.Element {
  const schema = useMemo(() => buildDynamicZodSchema(fields), [fields])
  const defaults = useMemo(() => buildDynamicDefaultValues(fields), [fields])

  const form = useForm<Record<string, unknown>>({
    resolver: zodResolver(schema),
    defaultValues: defaults,
    mode: 'onSubmit'
  })

  useEffect(() => {
    form.reset(defaults)
  }, [defaults, form])

  if (fields.length === 0) {
    return (
      <Alert severity="info">
        No custom fields in this section yet. Add a field (for example &quot;Tender Number&quot;) to
        preview the dynamic form.
      </Alert>
    )
  }

  const handleSubmit = form.handleSubmit(async (values) => {
    await onSubmit?.(values)
  })

  return (
    <Box component="form" onSubmit={handleSubmit}>
      <Stack spacing={2}>
        <Typography variant="subtitle2" color="text.secondary">
          Dynamic form preview — schema is generated from field definitions (no hard-coded inputs).
        </Typography>

        {fields.map((field) => {
          const disabled = field.readOnly || field.type === 'auto' || field.type === 'calculated'

          if (field.type === 'checkbox') {
            return (
              <Controller
                key={field.id}
                name={field.fieldKey}
                control={form.control}
                render={({ field: controlField, fieldState }) => (
                  <FormControl error={Boolean(fieldState.error)}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={Boolean(controlField.value)}
                          onChange={(event) => controlField.onChange(event.target.checked)}
                          disabled={disabled}
                        />
                      }
                      label={field.label + (field.required ? ' *' : '')}
                    />
                    {fieldState.error && (
                      <FormHelperText>{fieldState.error.message}</FormHelperText>
                    )}
                  </FormControl>
                )}
              />
            )
          }

          if (field.type === 'radio') {
            return (
              <Controller
                key={field.id}
                name={field.fieldKey}
                control={form.control}
                render={({ field: controlField, fieldState }) => (
                  <FormControl error={Boolean(fieldState.error)} disabled={disabled}>
                    <FormLabel>{field.label + (field.required ? ' *' : '')}</FormLabel>
                    <RadioGroup
                      value={(controlField.value as string) ?? ''}
                      onChange={(event) => controlField.onChange(event.target.value)}
                    >
                      {field.options.map((option) => (
                        <FormControlLabel
                          key={option.id}
                          value={option.value}
                          control={<Radio />}
                          label={option.label}
                        />
                      ))}
                    </RadioGroup>
                    {fieldState.error && (
                      <FormHelperText>{fieldState.error.message}</FormHelperText>
                    )}
                  </FormControl>
                )}
              />
            )
          }

          if (field.type === 'dropdown') {
            return (
              <Controller
                key={field.id}
                name={field.fieldKey}
                control={form.control}
                render={({ field: controlField, fieldState }) => (
                  <TextField
                    select
                    label={field.label}
                    required={field.required}
                    disabled={disabled}
                    value={(controlField.value as string) ?? ''}
                    onChange={controlField.onChange}
                    onBlur={controlField.onBlur}
                    name={controlField.name}
                    inputRef={controlField.ref}
                    error={Boolean(fieldState.error)}
                    helperText={fieldState.error?.message}
                    fullWidth
                  >
                    {!field.required && <MenuItem value="">—</MenuItem>}
                    {field.options.map((option) => (
                      <MenuItem key={option.id} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </TextField>
                )}
              />
            )
          }

          const isNumber =
            field.type === 'number' ||
            field.type === 'currency' ||
            field.type === 'percentage' ||
            field.type === 'calculated'

          return (
            <Controller
              key={field.id}
              name={field.fieldKey}
              control={form.control}
              render={({ field: controlField, fieldState }) => (
                <TextField
                  label={field.label}
                  required={field.required && !disabled}
                  disabled={disabled}
                  type={
                    field.type === 'date' ? 'date' : isNumber ? 'number' : 'text'
                  }
                  multiline={field.type === 'textarea'}
                  minRows={field.type === 'textarea' ? 3 : undefined}
                  slotProps={{
                    inputLabel: field.type === 'date' ? { shrink: true } : undefined,
                    input:
                      field.type === 'currency'
                        ? {
                            startAdornment: (
                              <InputAdornment position="start">¤</InputAdornment>
                            )
                          }
                        : field.type === 'percentage'
                          ? {
                              endAdornment: <InputAdornment position="end">%</InputAdornment>
                            }
                          : undefined
                  }}
                  value={
                    controlField.value == null
                      ? ''
                      : (controlField.value as string | number)
                  }
                  onChange={(event) => {
                    if (isNumber) {
                      const raw = event.target.value
                      controlField.onChange(raw === '' ? null : Number(raw))
                    } else {
                      controlField.onChange(event.target.value)
                    }
                  }}
                  onBlur={controlField.onBlur}
                  name={controlField.name}
                  inputRef={controlField.ref}
                  error={Boolean(fieldState.error)}
                  helperText={fieldState.error?.message}
                  fullWidth
                />
              )}
            />
          )
        })}

        <Button type="submit" variant="contained" sx={{ alignSelf: 'flex-start' }}>
          {submitLabel}
        </Button>

        {form.formState.isSubmitSuccessful && (
          <Alert severity="success">Validation passed.</Alert>
        )}
      </Stack>
    </Box>
  )
}
