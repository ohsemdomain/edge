// _server/routes/payments.ts
import { eq, and, desc, gte, lte, sql } from 'drizzle-orm'
import { publicProcedure, router } from '../trpc'
import { getDb, schema } from '../db'

// Import shared types and utilities
import type { PaymentListResponse, PaymentBalanceResponse } from '~/payments/api'
import { toApiPaymentWithRelations } from '~/payments/transforms'
import { generatePaymentId } from '~/payments/constants'
import {
	paymentCreateSchema,
	paymentUpdateSchema,
	paymentListSchema,
	paymentIdSchema,
	paymentBalanceSchema
} from '~/payments/validation'


export const paymentsRouter = router({

	list: publicProcedure
		.input(paymentListSchema)
		.query(async ({ input, ctx }): Promise<PaymentListResponse> => {
			const db = getDb(ctx.env.DB)
			const { search, contactId, startDate, endDate, type, page, limit } = input
			const offset = (page - 1) * limit

			// Build conditions
			const conditions: any[] = []
			
			if (contactId) {
				conditions.push(eq(schema.payments.contactId, contactId))
			}

			if (type) {
				conditions.push(eq(schema.payments.type, type))
			}

			if (startDate) {
				conditions.push(gte(schema.payments.paymentDate, Math.floor(new Date(startDate).getTime() / 1000)))
			}

			if (endDate) {
				conditions.push(lte(schema.payments.paymentDate, Math.floor(new Date(endDate).getTime() / 1000)))
			}

			// Get payments with contact and invoice info
			const results = await db
				.select({
					payment: schema.payments,
					contact: {
						id: schema.contacts.id,
						companyName: schema.contacts.companyName,
						email: schema.contacts.email,
						primaryPhone: schema.contacts.primaryPhone
					},
					invoice: {
						id: schema.invoices.id,
						invoiceNumber: schema.invoices.invoiceNumber
					}
				})
				.from(schema.payments)
				.leftJoin(schema.contacts, eq(schema.payments.contactId, schema.contacts.id))
				.leftJoin(schema.invoices, eq(schema.payments.invoiceId, schema.invoices.id))
				.where(and(...conditions))
				.orderBy(desc(schema.payments.paymentDate))
				.limit(limit)
				.offset(offset)

			// Apply search filter if needed
			let filteredResults = results
			if (search) {
				filteredResults = results.filter(row => 
					row.contact?.companyName?.toLowerCase().includes(search.toLowerCase()) ||
					row.invoice?.invoiceNumber?.toLowerCase().includes(search.toLowerCase()) ||
					row.payment.notes?.toLowerCase().includes(search.toLowerCase())
				)
			}

			return {
				payments: filteredResults.map((row) => 
					toApiPaymentWithRelations(row.payment, {
						contactName: row.contact?.companyName || '',
						contactEmail: row.contact?.email || '',
						contactPhone: row.contact?.primaryPhone || '',
						invoiceNumber: row.invoice?.invoiceNumber || null
					})
				),
				totalItems: filteredResults.length
			}
		}),

	getById: publicProcedure
		.input(paymentIdSchema.transform(id => ({ id })))
		.query(async ({ input, ctx }) => {
			const db = getDb(ctx.env.DB)
			const { id } = input

			const result = await db
				.select({
					payment: schema.payments,
					contact: {
						id: schema.contacts.id,
						companyName: schema.contacts.companyName,
						email: schema.contacts.email,
						primaryPhone: schema.contacts.primaryPhone
					},
					invoice: {
						id: schema.invoices.id,
						invoiceNumber: schema.invoices.invoiceNumber
					}
				})
				.from(schema.payments)
				.leftJoin(schema.contacts, eq(schema.payments.contactId, schema.contacts.id))
				.leftJoin(schema.invoices, eq(schema.payments.invoiceId, schema.invoices.id))
				.where(eq(schema.payments.id, id))
				.limit(1)

			if (result.length === 0) {
				throw new Error('Payment not found')
			}

			const { payment, contact, invoice } = result[0]

			return toApiPaymentWithRelations(payment, {
				contactName: contact?.companyName || '',
				contactEmail: contact?.email || '',
				contactPhone: contact?.primaryPhone || '',
				invoiceNumber: invoice?.invoiceNumber || null
			})
		}),

	getBalance: publicProcedure
		.input(paymentBalanceSchema)
		.query(async ({ input, ctx }): Promise<PaymentBalanceResponse> => {
			const db = getDb(ctx.env.DB)
			const { contactId } = input

			// Get all active invoices for contact
			const invoices = await db
				.select({
					invoice: schema.invoices
				})
				.from(schema.invoices)
				.where(eq(schema.invoices.contactId, contactId))

			// Get invoice items to calculate total invoiced
			let totalInvoiced = 0
			for (const { invoice } of invoices) {
				const items = await db
					.select({
						total: sql<number>`${schema.invoiceItems.quantity} * ${schema.invoiceItems.unitPrice}`
					})
					.from(schema.invoiceItems)
					.where(eq(schema.invoiceItems.invoiceId, invoice.id))
				
				totalInvoiced += items.reduce((sum, item) => sum + item.total, 0)
			}

			// Get all active payments for contact
			const payments = await db
				.select({
					amount: schema.payments.amount
				})
				.from(schema.payments)
				.where(and(
					eq(schema.payments.contactId, contactId),
					eq(schema.payments.type, 'payment')
				))

			const totalPaid = payments.reduce((sum, payment) => sum + payment.amount, 0)

			return {
				totalInvoiced,
				totalPaid,
				balance: totalInvoiced - totalPaid
			}
		}),

	create: publicProcedure
		.input(paymentCreateSchema)
		.mutation(async ({ input, ctx }) => {
			const db = getDb(ctx.env.DB)
			const id = generatePaymentId()
			const createdAt = Math.floor(Date.now() / 1000)

			await db.insert(schema.payments).values({
				id,
				contactId: input.contactId,
				invoiceId: input.invoiceId || null,
				amount: input.amount,
				paymentDate: input.paymentDate,
				paymentMethod: input.paymentMethod || null,
				type: (input.type || 'payment') as 'payment' | 'refund',
				notes: input.notes || null,
					createdAt
			})

			// Return the created payment in API format
			const dbPayment = {
				id,
				contactId: input.contactId,
				invoiceId: input.invoiceId || null,
				amount: input.amount,
				paymentDate: input.paymentDate,
				paymentMethod: input.paymentMethod || null,
				type: (input.type || 'payment') as 'payment' | 'refund',
				notes: input.notes || null,
					createdAt
			}

			return toApiPaymentWithRelations(dbPayment, {
				contactName: '',
				contactEmail: '',
				contactPhone: '',
				invoiceNumber: null
			})
		}),

	update: publicProcedure
		.input(paymentUpdateSchema)
		.mutation(async ({ input, ctx }) => {
			const db = getDb(ctx.env.DB)

			await db
				.update(schema.payments)
				.set({
					contactId: input.contactId,
					invoiceId: input.invoiceId || null,
					amount: input.amount,
					paymentDate: input.paymentDate,
					paymentMethod: input.paymentMethod || null,
					type: (input.type || 'payment') as 'payment' | 'refund',
					notes: input.notes || null
				})
				.where(eq(schema.payments.id, input.id))

			return { success: true }
		}),

	delete: publicProcedure
		.input(paymentIdSchema)
		.mutation(async ({ input: id, ctx }) => {
			const db = getDb(ctx.env.DB)
			
			await db.delete(schema.payments).where(eq(schema.payments.id, id))
			
			return { success: true }
		})
})