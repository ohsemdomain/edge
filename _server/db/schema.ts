import { integer, real, sqliteTable, text, index, uniqueIndex } from 'drizzle-orm/sqlite-core'

// Import schemas from shared
import { items as itemsTable } from '~/items/database'
import { contacts as contactsTable, contactAddresses as contactAddressesTable } from '~/contacts/database'

export { items } from '~/items/database'
export { contacts, contactAddresses } from '~/contacts/database'

// Invoices table
export const invoices = sqliteTable('invoices', {
	id: text('id').primaryKey(),
	contactId: text('contact_id').notNull().references(() => contactsTable.id),
	invoiceNumber: text('invoice_number').notNull().unique(),
	invoiceDate: integer('invoice_date').notNull(),
	dueDate: integer('due_date'),
	notes: text('notes'),
	isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
	createdAt: integer('created_at').notNull()
}, (table) => ({
	contactIdIdx: index('idx_invoices_contact_id').on(table.contactId),
	invoiceNumberIdx: index('idx_invoices_invoice_number').on(table.invoiceNumber),
	isActiveIdx: index('idx_invoices_is_active').on(table.isActive)
}))

// Invoice Items table
export const invoiceItems = sqliteTable('invoice_items', {
	id: text('id').primaryKey(),
	invoiceId: text('invoice_id').notNull().references(() => invoices.id, { onDelete: 'cascade' }),
	itemId: text('item_id').references(() => itemsTable.id),
	description: text('description').notNull(),
	quantity: real('quantity').notNull().default(1),
	unitPrice: real('unit_price').notNull().default(0),
	createdAt: integer('created_at').notNull()
}, (table) => ({
	invoiceIdIdx: index('idx_invoice_items_invoice_id').on(table.invoiceId),
	itemIdIdx: index('idx_invoice_items_item_id').on(table.itemId)
}))

// Payments table
export const payments = sqliteTable('payments', {
	id: text('id').primaryKey(),
	contactId: text('contact_id').notNull().references(() => contactsTable.id),
	invoiceId: text('invoice_id').references(() => invoices.id),
	amount: real('amount').notNull(),
	paymentDate: integer('payment_date').notNull(),
	paymentMethod: text('payment_method'),
	type: text('type').notNull().default('payment'),
	notes: text('notes'),
	isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
	createdAt: integer('created_at').notNull()
}, (table) => ({
	contactIdIdx: index('idx_payments_contact_id').on(table.contactId),
	invoiceIdIdx: index('idx_payments_invoice_id').on(table.invoiceId),
	paymentDateIdx: index('idx_payments_payment_date').on(table.paymentDate),
	typeIdx: index('idx_payments_type').on(table.type),
	isActiveIdx: index('idx_payments_is_active').on(table.isActive)
}))

// Type exports (items and contacts types are exported from shared)
// export type Item = typeof itemsTable.$inferSelect
// export type NewItem = typeof itemsTable.$inferInsert
// export type Contact = typeof contactsTable.$inferSelect
// export type NewContact = typeof contactsTable.$inferInsert
// export type ContactAddress = typeof contactAddressesTable.$inferSelect
// export type NewContactAddress = typeof contactAddressesTable.$inferInsert
export type Invoice = typeof invoices.$inferSelect
export type NewInvoice = typeof invoices.$inferInsert
export type InvoiceItem = typeof invoiceItems.$inferSelect
export type NewInvoiceItem = typeof invoiceItems.$inferInsert
export type Payment = typeof payments.$inferSelect
export type NewPayment = typeof payments.$inferInsert