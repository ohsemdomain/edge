// _server/routes/payments.ts
import { z } from 'zod'
import { createArchiveRouter } from '../lib/archiveProcedures'
import { publicProcedure, router } from '../trpc'

const archivePaymentsRouter = createArchiveRouter('payments')

export const paymentsRouter = router({
	...archivePaymentsRouter,

	list: publicProcedure
		.input(
			z.object({
				search: z.string().optional(),
				contactId: z.string().optional(),
				startDate: z.string().optional(),
				endDate: z.string().optional(),
				type: z.enum(['payment', 'refund']).optional(),
				page: z.number().default(1),
				limit: z.number().default(1000),
				isActive: z.boolean().default(true)
			})
		)
		.query(async ({ input, ctx }) => {
			const { DB } = ctx.env
			const { search, contactId, startDate, endDate, type, page, limit, isActive } = input
			const offset = (page - 1) * limit

			let query = `
				SELECT 
					p.*,
					c.company_name as contact_name,
					i.invoice_number
				FROM payments p
				LEFT JOIN contacts c ON p.contact_id = c.id
				LEFT JOIN invoices i ON p.invoice_id = i.id
				WHERE p.is_active = ?
			`
			const params: (string | number | boolean)[] = [isActive]

			if (contactId) {
				query += ' AND p.contact_id = ?'
				params.push(contactId)
			}

			if (type) {
				query += ' AND p.type = ?'
				params.push(type)
			}

			if (startDate) {
				query += ' AND p.payment_date >= ?'
				params.push(Math.floor(new Date(startDate).getTime() / 1000))
			}

			if (endDate) {
				query += ' AND p.payment_date <= ?'
				params.push(Math.floor(new Date(endDate).getTime() / 1000))
			}

			if (search) {
				query += ' AND (c.company_name LIKE ? OR i.invoice_number LIKE ? OR p.notes LIKE ?)'
				params.push(`%${search}%`, `%${search}%`, `%${search}%`)
			}

			query += ' ORDER BY p.payment_date DESC LIMIT ? OFFSET ?'
			params.push(limit, offset)

			const { results: payments } = await DB.prepare(query)
				.bind(...params)
				.all()

			return {
				payments: payments.map((payment: any) => ({
					...payment,
					paymentDate: payment.payment_date,
					paymentMethod: payment.payment_method,
					contactName: payment.contact_name,
					invoiceNumber: payment.invoice_number
				})),
				totalPayments: payments.length
			}
		}),

	getById: publicProcedure
		.input(z.object({ id: z.string() }))
		.query(async ({ input, ctx }) => {
			const { DB } = ctx.env
			const { id } = input

			const payment = await DB.prepare(`
				SELECT 
					p.*,
					c.company_name as contact_name,
					c.email as contact_email,
					c.primary_phone as contact_phone,
					i.invoice_number
				FROM payments p
				LEFT JOIN contacts c ON p.contact_id = c.id
				LEFT JOIN invoices i ON p.invoice_id = i.id
				WHERE p.id = ?
			`)
				.bind(id)
				.first()

			if (!payment) {
				throw new Error('Payment not found')
			}

			return {
				id: payment.id,
				contact_id: payment.contact_id,
				contact_name: payment.contact_name,
				contact_email: payment.contact_email,
				contact_phone: payment.contact_phone,
				invoice_id: payment.invoice_id,
				invoice_number: payment.invoice_number,
				amount: payment.amount,
				paymentDate: payment.payment_date,
				paymentMethod: payment.payment_method,
				type: payment.type || 'payment',
				notes: payment.notes,
				is_active: payment.is_active,
				created_at: payment.created_at
			}
		}),

	create: publicProcedure
		.input(
			z.object({
				contactId: z.string(),
				invoiceId: z.string().optional(),
				amount: z.number().positive(),
				paymentDate: z.string().datetime(),
				paymentMethod: z.string().optional(),
				type: z.enum(['payment', 'refund']).default('payment'),
				notes: z.string().optional()
			})
		)
		.mutation(async ({ input, ctx }) => {
			const { DB } = ctx.env
			const paymentId = crypto.randomUUID().slice(0, 8)
			const createdAt = Math.floor(Date.now() / 1000)

			await DB.prepare(
				`INSERT INTO payments (id, contact_id, invoice_id, amount, payment_date, payment_method, type, notes, is_active, created_at)
				 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
			)
				.bind(
					paymentId,
					input.contactId,
					input.invoiceId || null,
					input.amount,
					Math.floor(new Date(input.paymentDate).getTime() / 1000),
					input.paymentMethod || null,
					input.type,
					input.notes || null,
					true,
					createdAt
				)
				.run()

			return {
				id: paymentId,
				createdAt: new Date(createdAt * 1000)
			}
		}),

	update: publicProcedure
		.input(
			z.object({
				id: z.string(),
				contactId: z.string(),
				invoiceId: z.string().optional(),
				amount: z.number().positive(),
				paymentDate: z.string().datetime(),
				paymentMethod: z.string().optional(),
				type: z.enum(['payment', 'refund']).default('payment'),
				notes: z.string().optional()
			})
		)
		.mutation(async ({ input, ctx }) => {
			const { DB } = ctx.env

			await DB.prepare(
				`UPDATE payments 
				 SET contact_id = ?, invoice_id = ?, amount = ?, payment_date = ?, 
				     payment_method = ?, type = ?, notes = ?
				 WHERE id = ?`
			)
				.bind(
					input.contactId,
					input.invoiceId || null,
					input.amount,
					Math.floor(new Date(input.paymentDate).getTime() / 1000),
					input.paymentMethod || null,
					input.type,
					input.notes || null,
					input.id
				)
				.run()

			return { success: true }
		}),

	delete: publicProcedure
		.input(z.object({ id: z.string() }))
		.mutation(async ({ input, ctx }) => {
			const { DB } = ctx.env
			await DB.prepare('DELETE FROM payments WHERE id = ?')
				.bind(input.id)
				.run()
			return { success: true }
		})
})