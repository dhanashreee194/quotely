import { z } from 'zod'

const optionalText = z.string().optional().nullable()

const optionalEmail = z
  .string()
  .optional()
  .nullable()
  .refine((value) => !value || value.trim() === '' || z.email().safeParse(value).success, {
    message: 'Enter a valid email'
  })

export const customerFormSchema = z.object({
  name: z.string().trim().min(1, 'Name is required'),
  companyName: optionalText,
  contactPerson: optionalText,
  address: optionalText,
  phone: optionalText,
  email: optionalEmail,
  taxNumber: optionalText,
  billingAddress: optionalText,
  shippingAddress: optionalText
})

export type CustomerFormValues = z.infer<typeof customerFormSchema>

export const productFormSchema = z.object({
  itemCode: z.string().trim().min(1, 'Item code is required'),
  name: z.string().trim().min(1, 'Name is required'),
  description: optionalText,
  unit: optionalText,
  standardPrice: z.number().min(0, 'Price must be 0 or greater'),
  taxPercent: z.number().min(0, 'Tax must be 0 or greater').max(100, 'Tax cannot exceed 100'),
  category: optionalText,
  hsnSac: optionalText
})

export type ProductFormValues = z.infer<typeof productFormSchema>

export const termsFormSchema = z.object({
  title: z.string().trim().min(1, 'Title is required'),
  body: z.string().trim().min(1, 'Body is required')
})

export type TermsFormValues = z.infer<typeof termsFormSchema>

export const companyFormSchema = z.object({
  name: z.string().trim().min(1, 'Company name is required'),
  logoPath: optionalText,
  address: optionalText,
  phone: optionalText,
  email: optionalEmail,
  website: optionalText,
  taxRegNumber: optionalText,
  panNumber: optionalText,
  bankDetails: optionalText,
  authorizedSignatory: optionalText,
  signaturePath: optionalText,
  footer: optionalText
})

export type CompanyFormValues = z.infer<typeof companyFormSchema>

export const chargeRuleFormSchema = z.object({
  name: z.string().trim().min(1, 'Name is required'),
  type: z.enum(['percentage', 'fixed']),
  value: z.number().min(0, 'Value must be 0 or greater'),
  appliesToSubtotal: z.boolean()
})

export type ChargeRuleFormValues = z.infer<typeof chargeRuleFormSchema>
