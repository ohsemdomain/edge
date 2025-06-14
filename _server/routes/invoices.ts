// _server/routes/invoices.ts
import { z } from 'zod'
import { createArchiveRouter } from '../lib/archiveProcedures'
import { publicProcedure, router } from '../trpc'

interface InvoiceRow {
	id: string
	contact_id: string
	invoice_number: string
	invoice_date: number
	due_date: number | null
	notes: string | null
	is_active: boolean
	created_at: number
}

interface InvoiceItemRow {
	id: string
	invoice_id: string
	item_id: string | null
	description: string
	quantity: number
	unit_price: number
	created_at: number
}

interface PaymentRow {
	id: string
	contact_id: string
	invoice_id: string | null
	amount: number
	payment_date: number
	payment_method: string | null
	notes: string | null
	created_at: number
}

interface ContactRow {
	id: string
	name: string
	email: string | null
	phone: string | null
	is_active: boolean
	created_at: number
}

const archiveInvoicesRouter = createArchiveRouter('invoices')

// Helper function to generate invoice number
async function generateInvoiceNumber(DB: any): Promise<string> {
	const year = new Date().getFullYear()
	const prefix = `INV${year}`
	
	// Get the latest invoice number for this year
	const { results } = await DB.prepare(
		`SELECT invoice_number FROM invoices 
		 WHERE invoice_number LIKE ? 
		 ORDER BY invoice_number DESC 
		 LIMIT 1`
	)
		.bind(`${prefix}%`)
		.all<{ invoice_number: string }>()
	
	if (results.length === 0) {
		return `${prefix}0001`
	}
	
	const lastNumber = parseInt(results[0].invoice_number.slice(-4)) || 0
	const nextNumber = lastNumber + 1
	return `${prefix}${nextNumber.toString().padStart(4, '0')}`
}

export const invoicesRouter = router({
	...archiveInvoicesRouter,

	list: publicProcedure
		.input(
			z.object({
				search: z.string().optional(),
				page: z.number().default(1),
				limit: z.number().default(1000),
				isActive: z.boolean().default(true)
			})
		)
		.query(async ({ input, ctx }) => {
			const { DB } = ctx.env
			const { search, page, limit, isActive } = input
			const offset = (page - 1) * limit

			// Get invoices with contact info and calculated totals
			let query = `
				SELECT 
					i.*,
					c.company_name as contact_name,
					c.email as contact_email,
					COALESCE(SUM(ii.quantity * ii.unit_price), 0) as total
				FROM invoices i
				LEFT JOIN contacts c ON i.contact_id = c.id
				LEFT JOIN invoice_items ii ON i.id = ii.invoice_id
				WHERE i.is_active = ?
			`
			const params: (string | number | boolean)[] = [isActive]

			if (search) {
				query += ' AND (i.invoice_number LIKE ? OR c.company_name LIKE ?)'
				params.push(`%${search}%`, `%${search}%`)
			}

			query += ' GROUP BY i.id'
			query += ' ORDER BY i.created_at DESC LIMIT ? OFFSET ?'
			params.push(limit, offset)

			const { results: invoices } = await DB.prepare(query)
				.bind(...params)
				.all<InvoiceRow & { contact_name: string; contact_email: string | null; total: number }>()

			// Get contact balances for all unique contacts
			const contactIds = [...new Set(invoices.map(inv => inv.contact_id))]
			const balances: Record<string, number> = {}
			
			if (contactIds.length > 0) {
				// Get invoice totals by contact
				const { results: invoiceTotals } = await DB.prepare(`
					SELECT 
						i.contact_id,
						COALESCE(SUM(ii.quantity * ii.unit_price), 0) as total
					FROM invoices i
					LEFT JOIN invoice_items ii ON i.id = ii.invoice_id
					WHERE i.contact_id IN (${contactIds.map(() => '?').join(',')})
					AND i.is_active = true
					GROUP BY i.contact_id
				`)
					.bind(...contactIds)
					.all<{ contact_id: string; total: number }>()

				// Get payment totals by contact
				const { results: paymentTotals } = await DB.prepare(`
					SELECT 
						contact_id,
						COALESCE(SUM(amount), 0) as total
					FROM payments
					WHERE contact_id IN (${contactIds.map(() => '?').join(',')})
					GROUP BY contact_id
				`)
					.bind(...contactIds)
					.all<{ contact_id: string; total: number }>()

				// Calculate balances
				invoiceTotals.forEach(({ contact_id, total }) => {
					balances[contact_id] = total
				})
				paymentTotals.forEach(({ contact_id, total }) => {
					balances[contact_id] = (balances[contact_id] || 0) - total
				})
			}

			return {
				invoices: invoices.map((invoice) => ({
					...invoice,
					createdAt: new Date(invoice.created_at * 1000),
					invoiceDate: new Date(invoice.invoice_date * 1000),
					dueDate: invoice.due_date ? new Date(invoice.due_date * 1000) : null,
					contactBalance: balances[invoice.contact_id] || 0,
					status: balances[invoice.contact_id] > 0 ? 'unpaid' : 'paid'
				})),
				totalInvoices: invoices.length
			}
		}),

	getById: publicProcedure
		.input(z.object({ id: z.string() }))
		.query(async ({ input, ctx }) => {
			const { DB } = ctx.env

			// Get invoice with contact info
			const { results: invoices } = await DB.prepare(`
				SELECT 
					i.*,
					c.company_name as contact_name,
					c.email as contact_email,
					c.primary_phone as contact_phone
				FROM invoices i
				LEFT JOIN contacts c ON i.contact_id = c.id
				WHERE i.id = ?
			`)
				.bind(input.id)
				.all<InvoiceRow & { contact_name: string; contact_email: string | null; contact_phone: string | null }>()

			if (invoices.length === 0) {
				throw new Error('Invoice not found')
			}

			const invoice = invoices[0]

			// Get invoice items
			const { results: items } = await DB.prepare(`
				SELECT 
					ii.*,
					i.name as item_name,
					i.description as item_description
				FROM invoice_items ii
				LEFT JOIN items i ON ii.item_id = i.id
				WHERE ii.invoice_id = ?
				ORDER BY ii.created_at ASC
			`)
				.bind(input.id)
				.all<InvoiceItemRow & { item_name: string | null; item_description: string | null }>()

			// Get payments for this invoice and contact
			const { results: payments } = await DB.prepare(`
				SELECT * FROM payments 
				WHERE contact_id = ? 
				ORDER BY payment_date DESC
			`)
				.bind(invoice.contact_id)
				.all<PaymentRow>()

			// Calculate totals
			const invoiceTotal = items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0)
			
			// Get contact balance
			const { results: invoiceTotals } = await DB.prepare(`
				SELECT COALESCE(SUM(ii.quantity * ii.unit_price), 0) as total
				FROM invoices i
				LEFT JOIN invoice_items ii ON i.id = ii.invoice_id
				WHERE i.contact_id = ? AND i.is_active = true
			`)
				.bind(invoice.contact_id)
				.all<{ total: number }>()

			const { results: paymentTotals } = await DB.prepare(`
				SELECT COALESCE(SUM(amount), 0) as total
				FROM payments
				WHERE contact_id = ?
			`)
				.bind(invoice.contact_id)
				.all<{ total: number }>()

			const contactBalance = (invoiceTotals[0]?.total || 0) - (paymentTotals[0]?.total || 0)

			return {
				...invoice,
				createdAt: new Date(invoice.created_at * 1000),
				invoiceDate: new Date(invoice.invoice_date * 1000),
				dueDate: invoice.due_date ? new Date(invoice.due_date * 1000) : null,
				items: items.map(item => ({
					...item,
					createdAt: new Date(item.created_at * 1000)
				})),
				payments: payments.map(payment => ({
					...payment,
					paymentDate: new Date(payment.payment_date * 1000),
					createdAt: new Date(payment.created_at * 1000)
				})),
				total: invoiceTotal,
				contactBalance,
				status: contactBalance > 0 ? 'unpaid' : 'paid'
			}
		}),

	create: publicProcedure
		.input(
			z.object({
				contactId: z.string(),
				invoiceDate: z.string().datetime(),
				notes: z.string().optional(),
				items: z.array(
					z.object({
						itemId: z.string().optional(),
						description: z.string().min(1),
						quantity: z.number().positive(),
						unitPrice: z.number().nonnegative()
					})
				).min(1)
			})
		)
		.mutation(async ({ input, ctx }) => {
			const { DB } = ctx.env
			const invoiceId = crypto.randomUUID().slice(0, 8)
			const createdAt = Math.floor(Date.now() / 1000)
			const invoiceNumber = await generateInvoiceNumber(DB)

			// Create invoice
			await DB.prepare(
				`INSERT INTO invoices (id, contact_id, invoice_number, invoice_date, due_date, notes, is_active, created_at) 
				 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
			)
				.bind(
					invoiceId,
					input.contactId,
					invoiceNumber,
					Math.floor(new Date(input.invoiceDate).getTime() / 1000),
					null, // No due date
					input.notes || null,
					true,
					createdAt
				)
				.run()

			// Create invoice items
			for (const item of input.items) {
				const itemId = crypto.randomUUID().slice(0, 8)
				await DB.prepare(
					`INSERT INTO invoice_items (id, invoice_id, item_id, description, quantity, unit_price, created_at)
					 VALUES (?, ?, ?, ?, ?, ?, ?)`
				)
					.bind(
						itemId,
						invoiceId,
						item.itemId || null,
						item.description,
						item.quantity,
						item.unitPrice,
						createdAt
					)
					.run()
			}

			return {
				id: invoiceId,
				invoiceNumber,
				createdAt: new Date(createdAt * 1000)
			}
		}),

	update: publicProcedure
		.input(
			z.object({
				id: z.string(),
				contactId: z.string(),
				invoiceDate: z.string().datetime(),
				notes: z.string().optional(),
				items: z.array(
					z.object({
						id: z.string().optional(),
						itemId: z.string().optional(),
						description: z.string().min(1),
						quantity: z.number().positive(),
						unitPrice: z.number().nonnegative()
					})
				).min(1)
			})
		)
		.mutation(async ({ input, ctx }) => {
			const { DB } = ctx.env
			const createdAt = Math.floor(Date.now() / 1000)

			// Update invoice
			await DB.prepare(
				`UPDATE invoices 
				 SET contact_id = ?, invoice_date = ?, due_date = ?, notes = ?
				 WHERE id = ?`
			)
				.bind(
					input.contactId,
					Math.floor(new Date(input.invoiceDate).getTime() / 1000),
					null, // No due date
					input.notes || null,
					input.id
				)
				.run()

			// Delete existing items
			await DB.prepare('DELETE FROM invoice_items WHERE invoice_id = ?')
				.bind(input.id)
				.run()

			// Create new items
			for (const item of input.items) {
				const itemId = item.id || crypto.randomUUID().slice(0, 8)
				await DB.prepare(
					`INSERT INTO invoice_items (id, invoice_id, item_id, description, quantity, unit_price, created_at)
					 VALUES (?, ?, ?, ?, ?, ?, ?)`
				)
					.bind(
						itemId,
						input.id,
						item.itemId || null,
						item.description,
						item.quantity,
						item.unitPrice,
						createdAt
					)
					.run()
			}

			return { success: true }
		}),

	// Payment management
	createPayment: publicProcedure
		.input(
			z.object({
				contactId: z.string(),
				invoiceId: z.string().optional(),
				amount: z.number().positive(),
				paymentDate: z.string().datetime(),
				paymentMethod: z.string().optional(),
				notes: z.string().optional()
			})
		)
		.mutation(async ({ input, ctx }) => {
			const { DB } = ctx.env
			const paymentId = crypto.randomUUID().slice(0, 8)
			const createdAt = Math.floor(Date.now() / 1000)

			await DB.prepare(
				`INSERT INTO payments (id, contact_id, invoice_id, amount, payment_date, payment_method, notes, created_at)
				 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
			)
				.bind(
					paymentId,
					input.contactId,
					input.invoiceId || null,
					input.amount,
					Math.floor(new Date(input.paymentDate).getTime() / 1000),
					input.paymentMethod || null,
					input.notes || null,
					createdAt
				)
				.run()

			return {
				id: paymentId,
				createdAt: new Date(createdAt * 1000)
			}
		}),

	deletePayment: publicProcedure
		.input(z.object({ id: z.string() }))
		.mutation(async ({ input, ctx }) => {
			const { DB } = ctx.env
			await DB.prepare('DELETE FROM payments WHERE id = ?')
				.bind(input.id)
				.run()
			return { success: true }
		})
})