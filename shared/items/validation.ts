// Zod validation schemas for item operations
import { z } from 'zod'
import { DEFAULT_ITEMS_LIMIT, DEFAULT_ITEMS_PAGE } from './constants'

// Item creation validation
export const itemCreateSchema = z.object({
	name: z.string().min(1, 'Name is required'),
	description: z.string().min(1, 'Description is required'),
	unitPrice: z.number().positive('Unit price must be positive')
})

// Item update validation
export const itemUpdateSchema = z.object({
	id: z.string().min(1, 'ID is required'),
	name: z.string().min(1, 'Name is required'),
	description: z.string().min(1, 'Description is required'),
	unitPrice: z.number().positive('Unit price must be positive')
})

// Item list query validation
export const itemListSchema = z.object({
	search: z.string().optional(),
	page: z.number().default(DEFAULT_ITEMS_PAGE),
	limit: z.number().default(DEFAULT_ITEMS_LIMIT),
	isActive: z.boolean().default(true)
})

// Item ID validation
export const itemIdSchema = z.string().min(1, 'Item ID is required')