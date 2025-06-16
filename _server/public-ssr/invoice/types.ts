export interface InvoiceRow {
	id: string
	contact_id: string
	invoice_number: string
	invoice_date: number
	due_date: number | null
	notes: string | null
	share_token: string | null
	is_active: boolean
	created_at: number
}

export interface InvoiceItemRow {
	id: string
	invoice_id: string
	item_id: string | null
	description: string
	quantity: number
	unit_price: number
	created_at: number
	item_name?: string | null
	item_description?: string | null
}

export interface ContactInfo {
	contact_name: string
	contact_email: string | null
	contact_phone: string | null
}

export interface InvoiceData extends InvoiceRow, ContactInfo {
	invoiceDate: Date
	dueDate: Date | null
	items: InvoiceItemRow[]
	total: number
}