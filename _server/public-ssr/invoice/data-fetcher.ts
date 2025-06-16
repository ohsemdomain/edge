import type { D1Database } from '@cloudflare/workers-types'
import type { InvoiceRow, InvoiceItemRow, ContactInfo, InvoiceData } from './types'

// Get invoice data by share token for public viewing
export async function getInvoiceByShareToken(shareToken: string, db: D1Database): Promise<InvoiceData | null> {
	// Get invoice with contact info by share token
	const { results: invoices } = await db.prepare(`
		SELECT 
			i.*,
			c.company_name as contact_name,
			c.email as contact_email,
			c.primary_phone as contact_phone
		FROM invoices i
		LEFT JOIN contacts c ON i.contact_id = c.id
		WHERE i.share_token = ? AND i.is_active = 1
	`)
		.bind(shareToken)
		.all<InvoiceRow & ContactInfo>()

	if (invoices.length === 0) {
		return null
	}

	const invoice = invoices[0]

	// Get invoice items
	const { results: items } = await db.prepare(`
		SELECT 
			ii.*,
			i.name as item_name,
			i.description as item_description
		FROM invoice_items ii
		LEFT JOIN items i ON ii.item_id = i.id
		WHERE ii.invoice_id = ?
		ORDER BY ii.created_at ASC
	`)
		.bind(invoice.id)
		.all<InvoiceItemRow>()

	// Calculate total
	const total = items.reduce((sum: number, item: InvoiceItemRow) => 
		sum + (item.quantity * item.unit_price), 0)

	// Return complete invoice data
	return {
		...invoice,
		invoiceDate: new Date(invoice.invoice_date * 1000),
		dueDate: invoice.due_date ? new Date(invoice.due_date * 1000) : null,
		items,
		total
	}
}

// Get invoice data by ID for internal use (includes sensitive data)
export async function getInvoiceById(invoiceId: string, db: D1Database): Promise<any> {
	// Get invoice with contact info
	const { results: invoices } = await db.prepare(`
		SELECT 
			i.*,
			c.company_name as contact_name,
			c.email as contact_email,
			c.primary_phone as contact_phone
		FROM invoices i
		LEFT JOIN contacts c ON i.contact_id = c.id
		WHERE i.id = ?
	`)
		.bind(invoiceId)
		.all<InvoiceRow & ContactInfo>()

	if (invoices.length === 0) {
		throw new Error('Invoice not found')
	}

	const invoice = invoices[0]

	// Get invoice items
	const { results: items } = await db.prepare(`
		SELECT 
			ii.*,
			i.name as item_name,
			i.description as item_description
		FROM invoice_items ii
		LEFT JOIN items i ON ii.item_id = i.id
		WHERE ii.invoice_id = ?
		ORDER BY ii.created_at ASC
	`)
		.bind(invoiceId)
		.all<InvoiceItemRow>()

	// Get payments for this invoice and contact
	const { results: payments } = await db.prepare(`
		SELECT * FROM payments 
		WHERE contact_id = ? 
		ORDER BY payment_date DESC
	`)
		.bind(invoice.contact_id)
		.all()

	// Calculate totals
	const invoiceTotal = items.reduce((sum: number, item: InvoiceItemRow) => 
		sum + (item.quantity * item.unit_price), 0)
	
	// Get contact balance
	const { results: invoiceTotals } = await db.prepare(`
		SELECT COALESCE(SUM(ii.quantity * ii.unit_price), 0) as total
		FROM invoices i
		LEFT JOIN invoice_items ii ON i.id = ii.invoice_id
		WHERE i.contact_id = ? AND i.is_active = true
	`)
		.bind(invoice.contact_id)
		.all<{ total: number }>()

	const { results: paymentTotals } = await db.prepare(`
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
		payments: payments.map((payment: any) => ({
			...payment,
			paymentDate: new Date(payment.payment_date * 1000),
			createdAt: new Date(payment.created_at * 1000)
		})),
		total: invoiceTotal,
		contactBalance,
		status: contactBalance > 0 ? 'unpaid' : 'paid'
	}
}