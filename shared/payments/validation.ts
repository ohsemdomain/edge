// shared/payments/validation.ts
import { z } from 'zod'

// Base validation schemas
export const paymentCreateSchema = z.object({
  contactId: z.string().min(1),
  invoiceId: z.string().optional(),
  amount: z.number().positive(),
  paymentDate: z.number().int(),
  paymentMethod: z.string().optional(),
  type: z.enum(['payment', 'refund']).default('payment'),
  notes: z.string().optional()
})

export const paymentUpdateSchema = paymentCreateSchema.extend({
  id: z.string().min(1)
})

export const paymentListSchema = z.object({
  search: z.string().optional(),
  contactId: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  type: z.enum(['payment', 'refund']).optional(),
  page: z.number().default(1),
  limit: z.number().default(1000)
})

export const paymentIdSchema = z.string().min(1)

export const paymentBalanceSchema = z.object({
  contactId: z.string().min(1)
})