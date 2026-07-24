import { useCallback, useEffect, useMemo, useState } from 'react'
import { Controller, useFieldArray, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Checkbox from '@mui/material/Checkbox'
import Chip from '@mui/material/Chip'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import FormControl from '@mui/material/FormControl'
import FormControlLabel from '@mui/material/FormControlLabel'
import IconButton from '@mui/material/IconButton'
import InputLabel from '@mui/material/InputLabel'
import List from '@mui/material/List'
import ListItemButton from '@mui/material/ListItemButton'
import ListItemText from '@mui/material/ListItemText'
import MenuItem from '@mui/material/MenuItem'
import Paper from '@mui/material/Paper'
import Select from '@mui/material/Select'
import Stack from '@mui/material/Stack'
import Switch from '@mui/material/Switch'
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
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward'
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward'
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import StarBorderIcon from '@mui/icons-material/StarBorder'
import StarIcon from '@mui/icons-material/Star'
import {
  CUSTOM_FIELD_TYPES,
  ITEM_COLUMN_DATA_TYPES,
  RESERVED_QUOTATION_FIELD_KEYS,
  TEMPLATE_SECTION_TYPES,
  isReservedQuotationFieldKey
} from '../../../shared/metadata'
import type {
  QuotationTemplate,
  QuotationTemplateBundle
} from '../../../shared/types'
import DynamicForm from '../components/DynamicForm'
import { useQuotationTemplatesStore } from '../stores/quotationTemplatesStore'

const templateSchema = z.object({
  name: z.string().trim().min(1, 'Name is required'),
  description: z.string().optional().nullable(),
  isDefault: z.boolean()
})

const sectionSchema = z.object({
  name: z.string().trim().min(1, 'Name is required'),
  type: z.enum(TEMPLATE_SECTION_TYPES),
  enabled: z.boolean()
})

const fieldSchema = z
  .object({
    fieldKey: z
      .string()
      .trim()
      .min(1, 'Field key is required')
      .regex(/^[a-zA-Z][a-zA-Z0-9_]*$/, 'Use a valid identifier (letters, numbers, _)')
      .refine((key) => !isReservedQuotationFieldKey(key), {
        message: `Reserved keys cannot be custom fields: ${RESERVED_QUOTATION_FIELD_KEYS.join(', ')}`
      }),
    label: z.string().trim().min(1, 'Label is required'),
    type: z.enum(CUSTOM_FIELD_TYPES),
    required: z.boolean(),
    defaultValue: z.string().optional().nullable(),
    printVisible: z.boolean(),
    readOnly: z.boolean(),
    config: z.string().optional().nullable(),
    options: z.array(
      z.object({
        label: z.string().trim().min(1, 'Option label required'),
        value: z.string().trim().min(1, 'Option value required')
      })
    )
  })
  .superRefine((value, ctx) => {
    if (
      (value.type === 'dropdown' || value.type === 'radio') &&
      value.options.length === 0
    ) {
      ctx.addIssue({
        code: 'custom',
        message: 'Add at least one option for dropdown/radio',
        path: ['options']
      })
    }
  })

const columnSchema = z.object({
  label: z.string().trim().min(1, 'Label is required'),
  columnKey: z
    .string()
    .trim()
    .min(1, 'Column key is required')
    .regex(/^[a-zA-Z][a-zA-Z0-9_]*$/, 'Use a valid identifier'),
  dataType: z.enum(ITEM_COLUMN_DATA_TYPES),
  width: z.number().nullable().optional(),
  required: z.boolean(),
  visible: z.boolean(),
  printInclude: z.boolean(),
  participatesInCalc: z.boolean()
})

type TemplateForm = z.infer<typeof templateSchema>
type SectionForm = z.infer<typeof sectionSchema>
type FieldForm = z.infer<typeof fieldSchema>
type ColumnForm = z.infer<typeof columnSchema>

export default function QuotationTemplateEditor(): React.JSX.Element {
  const store = useQuotationTemplatesStore()
  const [templates, setTemplates] = useState<QuotationTemplate[]>([])
  const [bundle, setBundle] = useState<QuotationTemplateBundle | null>(null)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')

  const templateForm = useForm<TemplateForm>({
    resolver: zodResolver(templateSchema),
    defaultValues: { name: '', description: '', isDefault: false }
  })
  const sectionForm = useForm<SectionForm>({
    resolver: zodResolver(sectionSchema),
    defaultValues: { name: '', type: 'custom', enabled: true }
  })
  const fieldForm = useForm<FieldForm>({
    resolver: zodResolver(fieldSchema),
    defaultValues: {
      fieldKey: '',
      label: '',
      type: 'text',
      required: false,
      defaultValue: '',
      printVisible: true,
      readOnly: false,
      config: '',
      options: []
    }
  })
  const columnForm = useForm<ColumnForm>({
    resolver: zodResolver(columnSchema),
    defaultValues: {
      label: '',
      columnKey: '',
      dataType: 'text',
      width: 120,
      required: false,
      visible: true,
      printInclude: true,
      participatesInCalc: false
    }
  })

  const optionsArray = useFieldArray({ control: fieldForm.control, name: 'options' })
  const selectedFieldType = fieldForm.watch('type')

  const loadTemplates = useCallback(async (): Promise<void> => {
    try {
      const rows = await window.api.quotationTemplates.list()
      setTemplates(rows)
      setError('')
      if (store.selectedTemplateId == null && rows.length > 0) {
        const preferred = rows.find((row) => row.isDefault) ?? rows[0]
        store.selectTemplate(preferred.id)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load templates')
    }
  }, [store])

  const loadBundle = useCallback(async (): Promise<void> => {
    if (store.selectedTemplateId == null) {
      setBundle(null)
      return
    }
    try {
      const data = await window.api.quotationTemplates.get(store.selectedTemplateId)
      setBundle(data)
      if (data && store.selectedSectionId == null && data.sections.length > 0) {
        store.selectSection(data.sections[0].id)
      }
      setError('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load template')
    }
  }, [store])

  useEffect(() => {
    void loadTemplates()
  }, [loadTemplates])

  useEffect(() => {
    void loadBundle()
  }, [loadBundle, store.selectedTemplateId])

  useEffect(() => {
    if (!store.templateDialogOpen) return
    if (store.editingTemplateId == null) {
      templateForm.reset({ name: '', description: '', isDefault: false })
      return
    }
    const current = templates.find((row) => row.id === store.editingTemplateId)
    if (current) {
      templateForm.reset({
        name: current.name,
        description: current.description ?? '',
        isDefault: current.isDefault
      })
    }
  }, [store.templateDialogOpen, store.editingTemplateId, templateForm, templates])

  useEffect(() => {
    if (!store.sectionDialogOpen || !bundle) return
    if (store.editingSectionId == null) {
      sectionForm.reset({ name: '', type: 'custom', enabled: true })
      return
    }
    const current = bundle.sections.find((row) => row.id === store.editingSectionId)
    if (current) {
      sectionForm.reset({
        name: current.name,
        type: current.type,
        enabled: current.enabled
      })
    }
  }, [store.sectionDialogOpen, store.editingSectionId, sectionForm, bundle])

  useEffect(() => {
    if (!store.fieldDialogOpen || !bundle || store.selectedSectionId == null) return
    if (store.editingFieldId == null) {
      fieldForm.reset({
        fieldKey: '',
        label: '',
        type: 'text',
        required: false,
        defaultValue: '',
        printVisible: true,
        readOnly: false,
        config: '',
        options: []
      })
      return
    }
    const section = bundle.sections.find((row) => row.id === store.selectedSectionId)
    const current = section?.fields.find((row) => row.id === store.editingFieldId)
    if (current) {
      fieldForm.reset({
        fieldKey: current.fieldKey,
        label: current.label,
        type: current.type,
        required: current.required,
        defaultValue: current.defaultValue ?? '',
        printVisible: current.printVisible,
        readOnly: current.readOnly,
        config: current.config ?? '',
        options: current.options.map((option) => ({
          label: option.label,
          value: option.value
        }))
      })
    }
  }, [
    store.fieldDialogOpen,
    store.editingFieldId,
    store.selectedSectionId,
    fieldForm,
    bundle
  ])

  useEffect(() => {
    if (!store.columnDialogOpen || !bundle) return
    if (store.editingColumnId == null) {
      columnForm.reset({
        label: '',
        columnKey: '',
        dataType: 'text',
        width: 120,
        required: false,
        visible: true,
        printInclude: true,
        participatesInCalc: false
      })
      return
    }
    const current = bundle.itemColumns.find((row) => row.id === store.editingColumnId)
    if (current) {
      columnForm.reset({
        label: current.label,
        columnKey: current.columnKey,
        dataType: current.dataType,
        width: current.width,
        required: current.required,
        visible: current.visible,
        printInclude: current.printInclude,
        participatesInCalc: current.participatesInCalc
      })
    }
  }, [store.columnDialogOpen, store.editingColumnId, columnForm, bundle])

  const selectedSection = useMemo(
    () => bundle?.sections.find((section) => section.id === store.selectedSectionId) ?? null,
    [bundle, store.selectedSectionId]
  )

  const onSaveTemplate = templateForm.handleSubmit(async (values) => {
    try {
      if (store.editingTemplateId == null) {
        const created = await window.api.quotationTemplates.create(values)
        store.selectTemplate(created.id)
      } else {
        await window.api.quotationTemplates.update(store.editingTemplateId, values)
      }
      store.closeTemplateDialog()
      await loadTemplates()
      await loadBundle()
      setInfo('Template saved.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save template')
    }
  })

  const onSaveSection = sectionForm.handleSubmit(async (values) => {
    if (store.selectedTemplateId == null) return
    try {
      if (store.editingSectionId == null) {
        const created = await window.api.quotationTemplates.sections.create({
          templateId: store.selectedTemplateId,
          ...values
        })
        store.selectSection(created.id)
      } else {
        await window.api.quotationTemplates.sections.update(store.editingSectionId, values)
      }
      store.closeSectionDialog()
      await loadBundle()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save section')
    }
  })

  const onSaveField = fieldForm.handleSubmit(async (values) => {
    if (store.selectedTemplateId == null || store.selectedSectionId == null) return
    try {
      const payload = {
        ...values,
        defaultValue: values.defaultValue || null,
        config: values.config || null,
        options:
          values.type === 'dropdown' || values.type === 'radio' ? values.options : []
      }
      if (store.editingFieldId == null) {
        await window.api.quotationTemplates.fields.create({
          templateId: store.selectedTemplateId,
          sectionId: store.selectedSectionId,
          ...payload
        })
      } else {
        await window.api.quotationTemplates.fields.update(store.editingFieldId, payload)
      }
      store.closeFieldDialog()
      await loadBundle()
      setInfo('Custom field saved. Check the Preview tab — no code changes needed.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save field')
    }
  })

  const onSaveColumn = columnForm.handleSubmit(async (values) => {
    if (store.selectedTemplateId == null) return
    try {
      if (store.editingColumnId == null) {
        await window.api.quotationTemplates.itemColumns.create({
          templateId: store.selectedTemplateId,
          ...values
        })
      } else {
        await window.api.quotationTemplates.itemColumns.update(store.editingColumnId, values)
      }
      store.closeColumnDialog()
      await loadBundle()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save column')
    }
  })

  return (
    <Stack spacing={2}>
      <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h5">Quotation templates</Typography>
          <Typography color="text.secondary">
            Metadata-driven sections, custom fields, and item columns. Reserved keys (
            {RESERVED_QUOTATION_FIELD_KEYS.join(', ')}) stay as real quotation columns.
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={store.openTemplateCreate}>
          New template
        </Button>
      </Stack>

      {error && <Alert severity="error">{error}</Alert>}
      {info && (
        <Alert severity="success" onClose={() => setInfo('')}>
          {info}
        </Alert>
      )}

      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ alignItems: 'stretch' }}>
        <Paper variant="outlined" sx={{ width: { md: 280 }, p: 1, flexShrink: 0 }}>
          <List dense>
            {templates.map((template) => (
              <ListItemButton
                key={template.id}
                selected={template.id === store.selectedTemplateId}
                onClick={() => store.selectTemplate(template.id)}
              >
                <ListItemText
                  primary={
                    <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                      <span>{template.name}</span>
                      {template.isDefault && <Chip size="small" label="Default" />}
                    </Stack>
                  }
                  secondary={template.description}
                />
              </ListItemButton>
            ))}
          </List>
        </Paper>

        <Paper variant="outlined" sx={{ flex: 1, p: 2, minWidth: 0 }}>
          {!bundle ? (
            <Typography color="text.secondary">Select or create a template.</Typography>
          ) : (
            <Stack spacing={2}>
              <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography variant="h6">{bundle.name}</Typography>
                  <Typography color="text.secondary" variant="body2">
                    {bundle.description || 'No description'}
                  </Typography>
                </Box>
                <Stack direction="row" spacing={1}>
                  <IconButton
                    aria-label="Set default"
                    onClick={() =>
                      void window.api.quotationTemplates
                        .setDefault(bundle.id)
                        .then(loadTemplates)
                        .then(loadBundle)
                    }
                  >
                    {bundle.isDefault ? <StarIcon color="primary" /> : <StarBorderIcon />}
                  </IconButton>
                  <IconButton aria-label="Edit template" onClick={() => store.openTemplateEdit(bundle.id)}>
                    <EditOutlinedIcon />
                  </IconButton>
                  <IconButton
                    aria-label="Delete template"
                    disabled={bundle.isDefault}
                    onClick={() => {
                      if (!window.confirm('Delete this template?')) return
                      void window.api.quotationTemplates
                        .remove(bundle.id)
                        .then(() => {
                          store.selectTemplate(null)
                          return loadTemplates()
                        })
                        .catch((err: unknown) =>
                          setError(err instanceof Error ? err.message : 'Delete failed')
                        )
                    }}
                  >
                    <DeleteOutlinedIcon />
                  </IconButton>
                </Stack>
              </Stack>

              <Tabs
                value={store.editorTab}
                onChange={(_e, value: 'sections' | 'columns' | 'preview') =>
                  store.setEditorTab(value)
                }
              >
                <Tab label="Sections & fields" value="sections" />
                <Tab label="Item columns" value="columns" />
                <Tab label="Dynamic preview" value="preview" />
              </Tabs>

              {store.editorTab === 'sections' && (
                <Stack direction={{ xs: 'column', lg: 'row' }} spacing={2}>
                  <Box sx={{ flex: 1 }}>
                    <Stack
                      direction="row"
                      sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 1 }}
                    >
                      <Typography variant="subtitle1">Sections</Typography>
                      <Button size="small" startIcon={<AddIcon />} onClick={store.openSectionCreate}>
                        Add
                      </Button>
                    </Stack>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Name</TableCell>
                          <TableCell>Type</TableCell>
                          <TableCell>Enabled</TableCell>
                          <TableCell align="right">Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {bundle.sections.map((section, index) => (
                          <TableRow
                            key={section.id}
                            hover
                            selected={section.id === store.selectedSectionId}
                            onClick={() => store.selectSection(section.id)}
                            sx={{ cursor: 'pointer' }}
                          >
                            <TableCell>{section.name}</TableCell>
                            <TableCell>{section.type}</TableCell>
                            <TableCell>
                              <Switch
                                size="small"
                                checked={section.enabled}
                                onClick={(event) => event.stopPropagation()}
                                onChange={(_, checked) => {
                                  void window.api.quotationTemplates.sections
                                    .update(section.id, {
                                      name: section.name,
                                      type: section.type,
                                      enabled: checked
                                    })
                                    .then(loadBundle)
                                }}
                              />
                            </TableCell>
                            <TableCell align="right" onClick={(event) => event.stopPropagation()}>
                              <IconButton
                                size="small"
                                disabled={index === 0}
                                onClick={() =>
                                  void window.api.quotationTemplates.sections
                                    .reorder(section.id, 'up')
                                    .then(loadBundle)
                                }
                              >
                                <ArrowUpwardIcon fontSize="small" />
                              </IconButton>
                              <IconButton
                                size="small"
                                disabled={index === bundle.sections.length - 1}
                                onClick={() =>
                                  void window.api.quotationTemplates.sections
                                    .reorder(section.id, 'down')
                                    .then(loadBundle)
                                }
                              >
                                <ArrowDownwardIcon fontSize="small" />
                              </IconButton>
                              <IconButton
                                size="small"
                                onClick={() => store.openSectionEdit(section.id)}
                              >
                                <EditOutlinedIcon fontSize="small" />
                              </IconButton>
                              <IconButton
                                size="small"
                                onClick={() => {
                                  if (!window.confirm('Delete section and its fields?')) return
                                  void window.api.quotationTemplates.sections
                                    .remove(section.id)
                                    .then(loadBundle)
                                }}
                              >
                                <DeleteOutlinedIcon fontSize="small" />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </Box>

                  <Box sx={{ flex: 1 }}>
                    <Stack
                      direction="row"
                      sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 1 }}
                    >
                      <Typography variant="subtitle1">
                        Fields {selectedSection ? `· ${selectedSection.name}` : ''}
                      </Typography>
                      <Button
                        size="small"
                        startIcon={<AddIcon />}
                        disabled={!selectedSection}
                        onClick={store.openFieldCreate}
                      >
                        Add field
                      </Button>
                    </Stack>
                    {!selectedSection ? (
                      <Typography color="text.secondary">Select a section.</Typography>
                    ) : (
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Label</TableCell>
                            <TableCell>Key</TableCell>
                            <TableCell>Type</TableCell>
                            <TableCell>Required</TableCell>
                            <TableCell align="right">Actions</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {selectedSection.fields.length === 0 && (
                            <TableRow>
                              <TableCell colSpan={5}>
                                <Typography color="text.secondary">
                                  No custom fields yet. Try adding &quot;Tender Number&quot;.
                                </Typography>
                              </TableCell>
                            </TableRow>
                          )}
                          {selectedSection.fields.map((field, index) => (
                            <TableRow key={field.id} hover>
                              <TableCell>{field.label}</TableCell>
                              <TableCell>
                                <code>{field.fieldKey}</code>
                              </TableCell>
                              <TableCell>{field.type}</TableCell>
                              <TableCell>{field.required ? 'Yes' : 'No'}</TableCell>
                              <TableCell align="right">
                                <IconButton
                                  size="small"
                                  disabled={index === 0}
                                  onClick={() =>
                                    void window.api.quotationTemplates.fields
                                      .reorder(field.id, 'up')
                                      .then(loadBundle)
                                  }
                                >
                                  <ArrowUpwardIcon fontSize="small" />
                                </IconButton>
                                <IconButton
                                  size="small"
                                  disabled={index === selectedSection.fields.length - 1}
                                  onClick={() =>
                                    void window.api.quotationTemplates.fields
                                      .reorder(field.id, 'down')
                                      .then(loadBundle)
                                  }
                                >
                                  <ArrowDownwardIcon fontSize="small" />
                                </IconButton>
                                <IconButton
                                  size="small"
                                  onClick={() => store.openFieldEdit(field.id)}
                                >
                                  <EditOutlinedIcon fontSize="small" />
                                </IconButton>
                                <IconButton
                                  size="small"
                                  onClick={() => {
                                    if (!window.confirm('Delete this field?')) return
                                    void window.api.quotationTemplates.fields
                                      .remove(field.id)
                                      .then(loadBundle)
                                  }}
                                >
                                  <DeleteOutlinedIcon fontSize="small" />
                                </IconButton>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </Box>
                </Stack>
              )}

              {store.editorTab === 'columns' && (
                <Stack spacing={1}>
                  <Stack
                    direction="row"
                    sx={{ justifyContent: 'space-between', alignItems: 'center' }}
                  >
                    <Typography variant="subtitle1">Item table columns</Typography>
                    <Button size="small" startIcon={<AddIcon />} onClick={store.openColumnCreate}>
                      Add column
                    </Button>
                  </Stack>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Label</TableCell>
                        <TableCell>Key</TableCell>
                        <TableCell>Type</TableCell>
                        <TableCell>Visible</TableCell>
                        <TableCell>Calc</TableCell>
                        <TableCell align="right">Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {bundle.itemColumns.map((column, index) => (
                        <TableRow key={column.id} hover>
                          <TableCell>{column.label}</TableCell>
                          <TableCell>
                            <code>{column.columnKey}</code>
                          </TableCell>
                          <TableCell>{column.dataType}</TableCell>
                          <TableCell>{column.visible ? 'Yes' : 'No'}</TableCell>
                          <TableCell>{column.participatesInCalc ? 'Yes' : 'No'}</TableCell>
                          <TableCell align="right">
                            <IconButton
                              size="small"
                              disabled={index === 0}
                              onClick={() =>
                                void window.api.quotationTemplates.itemColumns
                                  .reorder(column.id, 'up')
                                  .then(loadBundle)
                              }
                            >
                              <ArrowUpwardIcon fontSize="small" />
                            </IconButton>
                            <IconButton
                              size="small"
                              disabled={index === bundle.itemColumns.length - 1}
                              onClick={() =>
                                void window.api.quotationTemplates.itemColumns
                                  .reorder(column.id, 'down')
                                  .then(loadBundle)
                              }
                            >
                              <ArrowDownwardIcon fontSize="small" />
                            </IconButton>
                            <IconButton
                              size="small"
                              onClick={() => store.openColumnEdit(column.id)}
                            >
                              <EditOutlinedIcon fontSize="small" />
                            </IconButton>
                            <IconButton
                              size="small"
                              onClick={() => {
                                if (!window.confirm('Delete this column?')) return
                                void window.api.quotationTemplates.itemColumns
                                  .remove(column.id)
                                  .then(loadBundle)
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
              )}

              {store.editorTab === 'preview' && (
                <Stack spacing={2}>
                  <FormControl sx={{ maxWidth: 320 }} size="small">
                    <InputLabel id="preview-section-label">Section</InputLabel>
                    <Select
                      labelId="preview-section-label"
                      label="Section"
                      value={store.selectedSectionId ?? ''}
                      onChange={(event) =>
                        store.selectSection(Number(event.target.value) || null)
                      }
                    >
                      {bundle.sections.map((section) => (
                        <MenuItem key={section.id} value={section.id}>
                          {section.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <DynamicForm
                    key={`${store.selectedSectionId}-${selectedSection?.fields
                      .map((field) => field.id)
                      .join('-')}`}
                    fields={selectedSection?.fields ?? []}
                    submitLabel="Validate dynamic form"
                  />
                </Stack>
              )}
            </Stack>
          )}
        </Paper>
      </Stack>

      <Dialog open={store.templateDialogOpen} onClose={store.closeTemplateDialog} fullWidth maxWidth="sm">
        <DialogTitle>
          {store.editingTemplateId == null ? 'New template' : 'Edit template'}
        </DialogTitle>
        <Box component="form" onSubmit={onSaveTemplate}>
          <DialogContent>
            <Stack spacing={2} sx={{ pt: 1 }}>
              <Controller
                name="name"
                control={templateForm.control}
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
                name="description"
                control={templateForm.control}
                render={({ field, fieldState }) => (
                  <TextField
                    {...field}
                    value={field.value ?? ''}
                    label="Description"
                    error={Boolean(fieldState.error)}
                    helperText={fieldState.error?.message}
                    fullWidth
                    multiline
                    minRows={2}
                  />
                )}
              />
              <Controller
                name="isDefault"
                control={templateForm.control}
                render={({ field }) => (
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={field.value}
                        onChange={(event) => field.onChange(event.target.checked)}
                      />
                    }
                    label="Set as default template"
                  />
                )}
              />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={store.closeTemplateDialog}>Cancel</Button>
            <Button type="submit" variant="contained">
              Save
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      <Dialog open={store.sectionDialogOpen} onClose={store.closeSectionDialog} fullWidth maxWidth="xs">
        <DialogTitle>
          {store.editingSectionId == null ? 'Add section' : 'Edit section'}
        </DialogTitle>
        <Box component="form" onSubmit={onSaveSection}>
          <DialogContent>
            <Stack spacing={2} sx={{ pt: 1 }}>
              <Controller
                name="name"
                control={sectionForm.control}
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
                control={sectionForm.control}
                render={({ field }) => (
                  <FormControl fullWidth>
                    <InputLabel id="section-type-label">Type</InputLabel>
                    <Select {...field} labelId="section-type-label" label="Type">
                      {TEMPLATE_SECTION_TYPES.map((type) => (
                        <MenuItem key={type} value={type}>
                          {type}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}
              />
              <Controller
                name="enabled"
                control={sectionForm.control}
                render={({ field }) => (
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={field.value}
                        onChange={(event) => field.onChange(event.target.checked)}
                      />
                    }
                    label="Enabled"
                  />
                )}
              />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={store.closeSectionDialog}>Cancel</Button>
            <Button type="submit" variant="contained">
              Save
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      <Dialog open={store.fieldDialogOpen} onClose={store.closeFieldDialog} fullWidth maxWidth="sm">
        <DialogTitle>{store.editingFieldId == null ? 'Add field' : 'Edit field'}</DialogTitle>
        <Box component="form" onSubmit={onSaveField}>
          <DialogContent>
            <Stack spacing={2} sx={{ pt: 1 }}>
              <Controller
                name="label"
                control={fieldForm.control}
                render={({ field, fieldState }) => (
                  <TextField
                    {...field}
                    label="Label"
                    error={Boolean(fieldState.error)}
                    helperText={fieldState.error?.message}
                    fullWidth
                  />
                )}
              />
              <Controller
                name="fieldKey"
                control={fieldForm.control}
                render={({ field, fieldState }) => (
                  <TextField
                    {...field}
                    label="Field key"
                    error={Boolean(fieldState.error)}
                    helperText={
                      fieldState.error?.message ||
                      'Identifier used in storage. Reserved quotation columns are blocked.'
                    }
                    fullWidth
                  />
                )}
              />
              <Controller
                name="type"
                control={fieldForm.control}
                render={({ field }) => (
                  <FormControl fullWidth>
                    <InputLabel id="field-type-label">Type</InputLabel>
                    <Select {...field} labelId="field-type-label" label="Type">
                      {CUSTOM_FIELD_TYPES.map((type) => (
                        <MenuItem key={type} value={type}>
                          {type}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}
              />
              <Controller
                name="defaultValue"
                control={fieldForm.control}
                render={({ field }) => (
                  <TextField {...field} value={field.value ?? ''} label="Default value" fullWidth />
                )}
              />
              <Controller
                name="config"
                control={fieldForm.control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    value={field.value ?? ''}
                    label="Config (JSON)"
                    fullWidth
                    multiline
                    minRows={2}
                    helperText='Optional extras, e.g. {"formula":"qty*rate"}'
                  />
                )}
              />
              <Stack direction="row" spacing={2}>
                <Controller
                  name="required"
                  control={fieldForm.control}
                  render={({ field }) => (
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={field.value}
                          onChange={(event) => field.onChange(event.target.checked)}
                        />
                      }
                      label="Required"
                    />
                  )}
                />
                <Controller
                  name="printVisible"
                  control={fieldForm.control}
                  render={({ field }) => (
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={field.value}
                          onChange={(event) => field.onChange(event.target.checked)}
                        />
                      }
                      label="Print visible"
                    />
                  )}
                />
                <Controller
                  name="readOnly"
                  control={fieldForm.control}
                  render={({ field }) => (
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={field.value}
                          onChange={(event) => field.onChange(event.target.checked)}
                        />
                      }
                      label="Read only"
                    />
                  )}
                />
              </Stack>

              {(selectedFieldType === 'dropdown' || selectedFieldType === 'radio') && (
                <Stack spacing={1}>
                  <Stack
                    direction="row"
                    sx={{ justifyContent: 'space-between', alignItems: 'center' }}
                  >
                    <Typography variant="subtitle2">Options</Typography>
                    <Button
                      size="small"
                      onClick={() => optionsArray.append({ label: '', value: '' })}
                    >
                      Add option
                    </Button>
                  </Stack>
                  {optionsArray.fields.map((option, index) => (
                    <Stack key={option.id} direction="row" spacing={1}>
                      <Controller
                        name={`options.${index}.label`}
                        control={fieldForm.control}
                        render={({ field, fieldState }) => (
                          <TextField
                            {...field}
                            label="Label"
                            size="small"
                            error={Boolean(fieldState.error)}
                            fullWidth
                          />
                        )}
                      />
                      <Controller
                        name={`options.${index}.value`}
                        control={fieldForm.control}
                        render={({ field, fieldState }) => (
                          <TextField
                            {...field}
                            label="Value"
                            size="small"
                            error={Boolean(fieldState.error)}
                            fullWidth
                          />
                        )}
                      />
                      <IconButton onClick={() => optionsArray.remove(index)}>
                        <DeleteOutlinedIcon fontSize="small" />
                      </IconButton>
                    </Stack>
                  ))}
                  {fieldForm.formState.errors.options && (
                    <Typography color="error" variant="caption">
                      {fieldForm.formState.errors.options.message as string}
                    </Typography>
                  )}
                </Stack>
              )}
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={store.closeFieldDialog}>Cancel</Button>
            <Button type="submit" variant="contained">
              Save
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      <Dialog open={store.columnDialogOpen} onClose={store.closeColumnDialog} fullWidth maxWidth="sm">
        <DialogTitle>
          {store.editingColumnId == null ? 'Add column' : 'Edit column'}
        </DialogTitle>
        <Box component="form" onSubmit={onSaveColumn}>
          <DialogContent>
            <Stack spacing={2} sx={{ pt: 1 }}>
              <Controller
                name="label"
                control={columnForm.control}
                render={({ field, fieldState }) => (
                  <TextField
                    {...field}
                    label="Label"
                    error={Boolean(fieldState.error)}
                    helperText={fieldState.error?.message}
                    fullWidth
                  />
                )}
              />
              <Controller
                name="columnKey"
                control={columnForm.control}
                render={({ field, fieldState }) => (
                  <TextField
                    {...field}
                    label="Column key"
                    error={Boolean(fieldState.error)}
                    helperText={fieldState.error?.message}
                    fullWidth
                  />
                )}
              />
              <Controller
                name="dataType"
                control={columnForm.control}
                render={({ field }) => (
                  <FormControl fullWidth>
                    <InputLabel id="column-type-label">Data type</InputLabel>
                    <Select {...field} labelId="column-type-label" label="Data type">
                      {ITEM_COLUMN_DATA_TYPES.map((type) => (
                        <MenuItem key={type} value={type}>
                          {type}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}
              />
              <Controller
                name="width"
                control={columnForm.control}
                render={({ field }) => (
                  <TextField
                    label="Width"
                    type="number"
                    value={field.value ?? ''}
                    onChange={(event) =>
                      field.onChange(
                        event.target.value === '' ? null : Number(event.target.value)
                      )
                    }
                    fullWidth
                  />
                )}
              />
              <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
                {(
                  [
                    ['required', 'Required'],
                    ['visible', 'Visible'],
                    ['printInclude', 'Print'],
                    ['participatesInCalc', 'In calc']
                  ] as const
                ).map(([name, label]) => (
                  <Controller
                    key={name}
                    name={name}
                    control={columnForm.control}
                    render={({ field }) => (
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={field.value}
                            onChange={(event) => field.onChange(event.target.checked)}
                          />
                        }
                        label={label}
                      />
                    )}
                  />
                ))}
              </Stack>
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={store.closeColumnDialog}>Cancel</Button>
            <Button type="submit" variant="contained">
              Save
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
    </Stack>
  )
}
