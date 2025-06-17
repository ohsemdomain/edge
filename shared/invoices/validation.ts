// shared/invoices/validation.ts
import { z } from 'zod'

// Invoice item validation schemas
export const invoiceItemCreateSchema = z.object({
  itemId: z.string().optional(),
  description: z.string().min(1, 'Description is required'),
  quantity: z.number().min(0.01, 'Quantity must be greater than 0'),
  unitPrice: z.number().min(0, 'Unit price must be non-negative')
})

export const invoiceItemSchema = invoiceItemCreateSchema.extend({
  id: z.string().min(1),
  invoiceId: z.string().min(1),
  createdAt: z.number().int()
})

// Invoice validation schemas
export const invoiceCreateSchema = z.object({
  contactId: z.string().min(1, 'Contact is required'),
  invoiceDate: z.number().int(),
  dueDate: z.number().int().optional(),
  notes: z.string().optional(),
  items: z.array(invoiceItemCreateSchema).min(1, 'At least one item is required')
})

export const invoiceUpdateSchema = invoiceCreateSchema.extend({
  id: z.string().min(1)
})

export const invoiceListSchema = z.object({
  search: z.string().optional(),
  page: z.number().default(1),
  limit: z.number().default(1000)
})

export const invoiceIdSchema = z.string().min(1, 'Invoice ID is required')