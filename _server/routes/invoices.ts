// _server/routes/invoices.ts
import { eq, like, and, desc, sql, inArray } from 'drizzle-orm'
import { publicProcedure, router } from '../trpc'
import { getDb, schema } from '../db'

// Import shared types and utilities
import type { InvoiceListResponse } from '~/invoices/api'
import { toApiInvoiceWithRelations, toApiInvoiceItem } from '~/invoices/transforms'
import { generateInvoiceId, generateInvoiceItemId, generateInvoiceNumber } from '~/invoices/constants'
import {
	invoiceCreateSchema,
	invoiceUpdateSchema,
	invoiceListSchema,
	invoiceIdSchema
} from '~/invoices/validation'


// Helper function to generate invoice number with database lookup
async function generateInvoiceNumberWithDb(db: ReturnType<typeof getDb>): Promise<string> {
	const year = new Date().getFullYear()
	const prefix = `INV${year}`
	
	// Get the latest invoice number for this year
	const results = await db
		.select({ invoiceNumber: schema.invoices.invoiceNumber })
		.from(schema.invoices)
		.where(like(schema.invoices.invoiceNumber, `${prefix}%`))
		.orderBy(desc(schema.invoices.invoiceNumber))
		.limit(1)
	
	const lastInvoiceNumber = results.length > 0 ? results[0].invoiceNumber : undefined
	return generateInvoiceNumber(lastInvoiceNumber)
}

export const invoicesRouter = router({

	list: publicProcedure
		.input(invoiceListSchema)
		.query(async ({ input, ctx }): Promise<InvoiceListResponse> => {
			const db = getDb(ctx.env.DB)
			const { search, page, limit } = input
			const offset = (page - 1) * limit

			// Build conditions
			const conditions: any[] = []
			
			// Get invoices with contact info
			const query = db
				.select({
					invoice: schema.invoices,
					contact: {
						id: schema.contacts.id,
						companyName: schema.contacts.companyName,
						email: schema.contacts.email
					}
				})
				.from(schema.invoices)
				.leftJoin(schema.contacts, eq(schema.invoices.contactId, schema.contacts.id))
				.where(conditions.length > 0 ? and(...conditions) : undefined)
				.orderBy(desc(schema.invoices.createdAt))
				.limit(limit)
				.offset(offset)

			const invoicesWithContacts = await query

			// Get invoice items and calculate totals
			const invoiceIds = invoicesWithContacts.map(row => row.invoice.id)
			const invoiceItems = invoiceIds.length > 0 
				? await db
					.select({
						invoiceId: schema.invoiceItems.invoiceId,
						total: sql<number>`${schema.invoiceItems.quantity} * ${schema.invoiceItems.unitPrice}`
					})
					.from(schema.invoiceItems)
					.where(inArray(schema.invoiceItems.invoiceId, invoiceIds))
				: []

			// Calculate totals per invoice
			const invoiceTotals = invoiceItems.reduce((acc, item) => {
				acc[item.invoiceId] = (acc[item.invoiceId] || 0) + item.total
				return acc
			}, {} as Record<string, number>)

			// Get invoice-level balances (not contact-level)
			const invoiceBalances: Record<string, number> = {}
			
			if (invoiceIds.length > 0) {
				// Get payments per invoice
				const payments = await db
					.select({
						invoiceId: schema.payments.invoiceId,
						amount: schema.payments.amount
					})
					.from(schema.payments)
					.where(and(
						inArray(schema.payments.invoiceId, invoiceIds),
						eq(schema.payments.type, 'payment')
					))

				const paymentTotalsByInvoice = payments.reduce((acc, payment) => {
					if (payment.invoiceId) {
						acc[payment.invoiceId] = (acc[payment.invoiceId] || 0) + payment.amount
					}
					return acc
				}, {} as Record<string, number>)

				// Calculate balance per invoice
				invoiceIds.forEach(invoiceId => {
					const invoiceTotal = invoiceTotals[invoiceId] || 0
					const paid = paymentTotalsByInvoice[invoiceId] || 0
					invoiceBalances[invoiceId] = invoiceTotal - paid
				})
			}

			// Apply search filter if needed
			let filteredResults = invoicesWithContacts
			if (search) {
				filteredResults = invoicesWithContacts.filter(row => 
					row.invoice.invoiceNumber.toLowerCase().includes(search.toLowerCase()) ||
					row.contact?.companyName?.toLowerCase().includes(search.toLowerCase())
				)
			}

			return {
				invoices: filteredResults.map(row => 
					toApiInvoiceWithRelations(row.invoice, {
						contactName: row.contact?.companyName || '',
						contactEmail: row.contact?.email || '',
						contactPhone: '', // Not loaded in list view
						total: invoiceTotals[row.invoice.id] || 0,
						balance: invoiceBalances[row.invoice.id] || 0,
						items: [], // Items not loaded in list view
						payments: [], // Not loaded in list view
						contact: row.contact ? {
							id: row.contact.id,
							companyName: row.contact.companyName,
							email: row.contact.email,
							primaryPhone: '' // Not loaded in this query
						} : null
					})
				),
				totalItems: filteredResults.length
			}
		}),

	getById: publicProcedure
		.input(invoiceIdSchema)
		.query(async ({ input: id, ctx }) => {
			const db = getDb(ctx.env.DB)
			
			// Get invoice with contact
			const result = await db
				.select({
					invoice: schema.invoices,
					contact: schema.contacts
				})
				.from(schema.invoices)
				.leftJoin(schema.contacts, eq(schema.invoices.contactId, schema.contacts.id))
				.where(eq(schema.invoices.id, id))
				.limit(1)

			if (result.length === 0) {
				throw new Error('Invoice not found')
			}

			const { invoice, contact } = result[0]

			// Get invoice items with items details
			const itemsResult = await db
				.select({
					invoiceItem: schema.invoiceItems,
					item: schema.items
				})
				.from(schema.invoiceItems)
				.leftJoin(schema.items, eq(schema.invoiceItems.itemId, schema.items.id))
				.where(eq(schema.invoiceItems.invoiceId, id))

			// Get all payments for this invoice 
			const paymentsResult = await db
				.select({
					id: schema.payments.id,
					amount: schema.payments.amount,
					paymentDate: schema.payments.paymentDate,
					paymentMethod: schema.payments.paymentMethod,
					notes: schema.payments.notes
				})
				.from(schema.payments)
				.where(and(
					eq(schema.payments.invoiceId, id),
					eq(schema.payments.type, 'payment')
				))

			const totalPaid = paymentsResult.reduce((sum, payment) => sum + payment.amount, 0)
			const total = itemsResult.reduce((sum, row) => sum + (row.invoiceItem.quantity * row.invoiceItem.unitPrice), 0)
			const balance = total - totalPaid

			// Transform to API format using shared transforms
			const apiInvoiceItems = itemsResult.map(row => ({
				...toApiInvoiceItem(row.invoiceItem),
				itemName: row.item?.name || null
			}))

			return toApiInvoiceWithRelations(invoice, {
				contactName: contact?.companyName || '',
				contactEmail: contact?.email || '',
				contactPhone: contact?.primaryPhone || '',
				total,
				balance,
				items: apiInvoiceItems,
				payments: paymentsResult.map(p => ({
					id: p.id,
					amount: p.amount,
					paymentDate: p.paymentDate,
					paymentMethod: p.paymentMethod || undefined,
					notes: p.notes || undefined
				})),
				contact: contact ? {
					id: contact.id,
					companyName: contact.companyName,
					email: contact.email,
					primaryPhone: contact.primaryPhone || ''
				} : null
			})
		}),

	create: publicProcedure
		.input(invoiceCreateSchema)
		.mutation(async ({ input, ctx }) => {
			const db = getDb(ctx.env.DB)
			const invoiceNumber = await generateInvoiceNumberWithDb(db)
			const id = generateInvoiceId()
			const createdAt = Math.floor(Date.now() / 1000)

			// Create invoice
			await db.insert(schema.invoices).values({
				id,
				contactId: input.contactId,
				invoiceNumber,
				invoiceDate: input.invoiceDate,
				dueDate: input.dueDate || null,
				notes: input.notes || null,
				createdAt
			})

			// Create invoice items
			for (const item of input.items) {
				const itemId = generateInvoiceItemId()
				await db.insert(schema.invoiceItems).values({
					id: itemId,
					invoiceId: id,
					itemId: item.itemId || null,
					description: item.description,
					quantity: item.quantity,
					unitPrice: item.unitPrice,
					createdAt
				})
			}

			// Return the created invoice in API format
			const dbInvoice = {
				id,
				contactId: input.contactId,
				invoiceNumber,
				invoiceDate: input.invoiceDate,
				dueDate: input.dueDate || null,
				notes: input.notes || null,
				createdAt
			}

			return toApiInvoiceWithRelations(dbInvoice, {
				contactName: '',
				contactEmail: '',
				contactPhone: '',
				total: 0,
				balance: 0,
				items: [],
				payments: [],
				contact: null
			})
		}),

	update: publicProcedure
		.input(invoiceUpdateSchema)
		.mutation(async ({ input, ctx }) => {
			const db = getDb(ctx.env.DB)

			// Update invoice
			await db
				.update(schema.invoices)
				.set({
					contactId: input.contactId,
					invoiceDate: input.invoiceDate,
					dueDate: input.dueDate || null,
					notes: input.notes || null
				})
				.where(eq(schema.invoices.id, input.id))

			// Delete existing items
			await db.delete(schema.invoiceItems).where(eq(schema.invoiceItems.invoiceId, input.id))

			// Create new items
			for (const item of input.items) {
				const itemId = generateInvoiceItemId()
				await db.insert(schema.invoiceItems).values({
					id: itemId,
					invoiceId: input.id,
					itemId: item.itemId || null,
					description: item.description,
					quantity: item.quantity,
					unitPrice: item.unitPrice,
					createdAt: Math.floor(Date.now() / 1000)
				})
			}

			return { success: true }
		}),

	delete: publicProcedure
		.input(invoiceIdSchema)
		.mutation(async ({ input: id, ctx }) => {
			const db = getDb(ctx.env.DB)
			
			// Check for related payments
			const relatedPayments = await db
				.select({ count: schema.payments.id })
				.from(schema.payments)
				.where(eq(schema.payments.invoiceId, id))
			
			const paymentCount = relatedPayments.length
			
			if (paymentCount > 0) {
				const paymentText = paymentCount === 1 ? 'payment' : 'payments'
				throw new Error(`Delete Failed: ${paymentCount} ${paymentText} exist`)
			}
			
			// Delete invoice items first (cascade)
			await db.delete(schema.invoiceItems).where(eq(schema.invoiceItems.invoiceId, id))
			
			// Delete invoice
			await db.delete(schema.invoices).where(eq(schema.invoices.id, id))
			
			return { success: true }
		})
})