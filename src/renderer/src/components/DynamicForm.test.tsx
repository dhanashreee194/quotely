import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { CustomFieldType } from '../../../shared/metadata'
import type { CustomFieldDefinitionWithOptions } from '../../../shared/types'
import DynamicForm from './DynamicForm'

const theme = createTheme()

function makeField(
  overrides: Partial<CustomFieldDefinitionWithOptions> & {
    fieldKey: string
    label: string
    type: CustomFieldType
  }
): CustomFieldDefinitionWithOptions {
  return {
    id: overrides.id ?? Math.floor(Math.random() * 100000),
    templateId: 1,
    sectionId: 1,
    fieldKey: overrides.fieldKey,
    label: overrides.label,
    type: overrides.type,
    required: overrides.required ?? false,
    defaultValue: overrides.defaultValue ?? null,
    displayOrder: overrides.displayOrder ?? 0,
    printVisible: true,
    readOnly: overrides.readOnly ?? false,
    config: null,
    options: overrides.options ?? []
  }
}

function renderForm(
  fields: CustomFieldDefinitionWithOptions[],
  props: Partial<React.ComponentProps<typeof DynamicForm>> = {}
): ReturnType<typeof render> {
  return render(
    <ThemeProvider theme={theme}>
      <DynamicForm fields={fields} {...props} />
    </ThemeProvider>
  )
}

describe('DynamicForm', () => {
  afterEach(() => {
    cleanup()
  })

  it('renders each supported field type', () => {
    const fields = [
      makeField({ id: 1, fieldKey: 'title', label: 'Title', type: 'text' }),
      makeField({ id: 2, fieldKey: 'notes', label: 'Notes', type: 'textarea' }),
      makeField({ id: 3, fieldKey: 'qty', label: 'Qty', type: 'number' }),
      makeField({ id: 4, fieldKey: 'amount', label: 'Amount', type: 'currency' }),
      makeField({ id: 5, fieldKey: 'tax', label: 'Tax', type: 'percentage' }),
      makeField({ id: 6, fieldKey: 'due', label: 'Due date', type: 'date' }),
      makeField({
        id: 7,
        fieldKey: 'priority',
        label: 'Priority',
        type: 'dropdown',
        options: [
          { id: 1, fieldDefinitionId: 7, label: 'High', value: 'high', displayOrder: 0 },
          { id: 2, fieldDefinitionId: 7, label: 'Low', value: 'low', displayOrder: 1 }
        ]
      }),
      makeField({ id: 8, fieldKey: 'urgent', label: 'Urgent', type: 'checkbox' }),
      makeField({
        id: 9,
        fieldKey: 'mode',
        label: 'Mode',
        type: 'radio',
        options: [
          { id: 3, fieldDefinitionId: 9, label: 'A', value: 'a', displayOrder: 0 },
          { id: 4, fieldDefinitionId: 9, label: 'B', value: 'b', displayOrder: 1 }
        ]
      }),
      makeField({ id: 10, fieldKey: 'autoNo', label: 'Auto No', type: 'auto', readOnly: true }),
      makeField({
        id: 11,
        fieldKey: 'calc',
        label: 'Calculated',
        type: 'calculated',
        readOnly: true
      })
    ]

    renderForm(fields)

    expect(screen.getByLabelText('Title')).toBeInTheDocument()
    expect(screen.getByLabelText('Notes')).toBeInTheDocument()
    expect(screen.getByLabelText('Qty')).toBeInTheDocument()
    expect(screen.getByLabelText('Amount')).toBeInTheDocument()
    expect(screen.getByLabelText('Tax')).toBeInTheDocument()
    expect(screen.getByLabelText('Due date')).toBeInTheDocument()
    expect(screen.getByLabelText('Priority')).toBeInTheDocument()
    expect(screen.getByLabelText(/Urgent/)).toBeInTheDocument()
    expect(screen.getByText('Mode')).toBeInTheDocument()
    expect(screen.getByLabelText('Auto No')).toBeDisabled()
    expect(screen.getByLabelText('Calculated')).toBeDisabled()
  })

  it('shows required validation when submitting empty required fields', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    const fields = [
      makeField({
        id: 20,
        fieldKey: 'tenderNumber',
        label: 'Tender Number',
        type: 'text',
        required: true
      })
    ]

    renderForm(fields, { onSubmit })

    await user.click(screen.getByRole('button', { name: 'Validate' }))

    expect(await screen.findByText(/Tender Number is required/i)).toBeInTheDocument()
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('submits successfully when required fields are filled', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    const fields = [
      makeField({
        id: 21,
        fieldKey: 'tenderNumber',
        label: 'Tender Number',
        type: 'text',
        required: true
      })
    ]

    renderForm(fields, { onSubmit })

    await user.type(screen.getByLabelText(/Tender Number/), 'TN-100')
    await user.click(screen.getByRole('button', { name: 'Validate' }))

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalled()
    })
    expect(onSubmit.mock.calls[0][0]).toMatchObject({ tenderNumber: 'TN-100' })
    expect(await screen.findByText('Validation passed.')).toBeInTheDocument()
  })
})
