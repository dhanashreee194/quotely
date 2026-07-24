import { z } from 'zod'
import type { CustomFieldDefinitionWithOptions } from '../../../shared/types'

function optionalNumber(required: boolean, label: string): z.ZodTypeAny {
  if (required) {
    return z.number({ error: `${label} is required` })
  }
  return z.union([z.number(), z.nan()]).optional().nullable().transform((value) => {
    if (value == null || (typeof value === 'number' && Number.isNaN(value))) {
      return null
    }
    return value
  })
}

export function buildDynamicZodSchema(fields: CustomFieldDefinitionWithOptions[]): z.ZodObject<Record<string, z.ZodTypeAny>> {
  const shape: Record<string, z.ZodTypeAny> = {}

  for (const field of fields) {
    const label = field.label

    switch (field.type) {
      case 'number':
      case 'currency':
      case 'percentage':
      case 'calculated': {
        shape[field.fieldKey] = optionalNumber(field.required && !field.readOnly, label)
        break
      }
      case 'checkbox': {
        shape[field.fieldKey] = z.boolean()
        break
      }
      case 'dropdown':
      case 'radio': {
        const values = field.options.map((option) => option.value).filter(Boolean)
        if (values.length === 0) {
          shape[field.fieldKey] = field.required
            ? z.string().trim().min(1, `${label} is required`)
            : z.string().optional().nullable()
        } else if (field.required) {
          shape[field.fieldKey] = z.enum(values as [string, ...string[]], {
            error: `${label} is required`
          })
        } else {
          shape[field.fieldKey] = z.union([z.enum(values as [string, ...string[]]), z.literal('')]).optional()
        }
        break
      }
      case 'auto': {
        shape[field.fieldKey] = z.string().optional().nullable()
        break
      }
      case 'date':
      case 'text':
      case 'textarea':
      default: {
        if (field.required && !field.readOnly) {
          shape[field.fieldKey] = z.string().trim().min(1, `${label} is required`)
        } else {
          shape[field.fieldKey] = z.string().optional().nullable()
        }
        break
      }
    }
  }

  return z.object(shape)
}

export function buildDynamicDefaultValues(
  fields: CustomFieldDefinitionWithOptions[]
): Record<string, unknown> {
  const values: Record<string, unknown> = {}

  for (const field of fields) {
    switch (field.type) {
      case 'checkbox':
        values[field.fieldKey] = field.defaultValue === 'true'
        break
      case 'number':
      case 'currency':
      case 'percentage':
      case 'calculated':
        values[field.fieldKey] =
          field.defaultValue != null && field.defaultValue !== ''
            ? Number(field.defaultValue)
            : field.required
              ? 0
              : null
        break
      default:
        values[field.fieldKey] = field.defaultValue ?? ''
    }
  }

  return values
}
