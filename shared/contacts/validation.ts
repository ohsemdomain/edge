// Zod validation schemas for contact operations
import { z } from 'zod'
import { DEFAULT_CONTACTS_LIMIT, DEFAULT_CONTACTS_PAGE } from './constants'

// Contact creation validation
export const contactCreateSchema = z.object({
	companyName: z.string().min(1, 'Company name is required'),
	personIncharge: z.string().min(1, 'Person in charge is required'),
	primaryPhone: z.string().min(1, 'Primary phone is required'),
	email: z.string().email('Invalid email').optional().or(z.literal('')),
	phoneAlt1: z.string().optional(),
	phoneAlt2: z.string().optional(),
	phoneAlt3: z.string().optional(),
	isSupplier: z.boolean().default(false)
})

// Contact update validation
export const contactUpdateSchema = z.object({
	id: z.string().min(1, 'ID is required'),
	companyName: z.string().min(1, 'Company name is required'),
	personIncharge: z.string().min(1, 'Person in charge is required'),
	primaryPhone: z.string().min(1, 'Primary phone is required'),
	email: z.string().email('Invalid email').optional().or(z.literal('')),
	phoneAlt1: z.string().optional(),
	phoneAlt2: z.string().optional(),
	phoneAlt3: z.string().optional(),
	isSupplier: z.boolean().default(false)
})

// Contact list query validation
export const contactListSchema = z.object({
	search: z.string().optional(),
	page: z.number().default(DEFAULT_CONTACTS_PAGE),
	limit: z.number().default(DEFAULT_CONTACTS_LIMIT),
	isActive: z.boolean().default(true)
})

// Contact ID validation
export const contactIdSchema = z.string().min(1, 'Contact ID is required')

// Contact address creation validation
export const contactAddressCreateSchema = z.object({
	contactId: z.string().min(1, 'Contact ID is required'),
	receiver: z.string().min(1, 'Receiver is required'),
	addressLine1: z.string().min(1, 'Address line 1 is required'),
	addressLine2: z.string().optional(),
	addressLine3: z.string().optional(),
	addressLine4: z.string().optional(),
	postcode: z.string().min(1, 'Postcode is required'),
	city: z.string().min(1, 'City is required'),
	state: z.string().min(1, 'State is required'),
	country: z.string().min(1, 'Country is required'),
	isDefaultBilling: z.boolean().default(false),
	isDefaultShipping: z.boolean().default(false)
})

// Contact address update validation
export const contactAddressUpdateSchema = z.object({
	id: z.string().min(1, 'ID is required'),
	receiver: z.string().min(1, 'Receiver is required'),
	addressLine1: z.string().min(1, 'Address line 1 is required'),
	addressLine2: z.string().optional(),
	addressLine3: z.string().optional(),
	addressLine4: z.string().optional(),
	postcode: z.string().min(1, 'Postcode is required'),
	city: z.string().min(1, 'City is required'),
	state: z.string().min(1, 'State is required'),
	country: z.string().min(1, 'Country is required'),
	isDefaultBilling: z.boolean().default(false),
	isDefaultShipping: z.boolean().default(false)
})

// Address ID validation
export const addressIdSchema = z.string().min(1, 'Address ID is required')