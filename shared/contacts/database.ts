// Database schema and types for contacts
import { integer, sqliteTable, text, index, uniqueIndex } from 'drizzle-orm/sqlite-core'

// Contacts table schema - using camelCase for TypeScript properties
export const contacts = sqliteTable('contacts', {
	id: text('id').primaryKey(),
	companyName: text('company_name').notNull().unique(),
	personIncharge: text('person_incharge').notNull(),
	primaryPhone: text('primary_phone').notNull(),
	email: text('email'),
	phoneAlt1: text('phone_alt_1'),
	phoneAlt2: text('phone_alt_2'),
	phoneAlt3: text('phone_alt_3'),
	isSupplier: integer('is_supplier', { mode: 'boolean' }).default(false), // FALSE = Client, TRUE = Supplier
	isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
	createdAt: integer('created_at').notNull()
}, (table) => ({
	activeIdx: index('idx_contacts_active').on(table.isActive),
	createdAtIdx: index('idx_contacts_created_at').on(table.createdAt),
	supplierIdx: index('idx_contacts_supplier').on(table.isSupplier),
	companyNameIdx: uniqueIndex('idx_contacts_company_name').on(table.companyName)
}))

// Contact Addresses table schema
export const contactAddresses = sqliteTable('contact_addresses', {
	id: text('id').primaryKey(),
	contactId: text('contact_id').notNull().references(() => contacts.id, { onDelete: 'cascade' }),
	receiver: text('receiver').notNull(),
	addressLine1: text('address_line1').notNull(),
	addressLine2: text('address_line2'),
	addressLine3: text('address_line3'),
	addressLine4: text('address_line4'),
	postcode: text('postcode').notNull(),
	city: text('city').notNull(),
	state: text('state').notNull(),
	country: text('country').notNull(),
	isDefaultBilling: integer('is_default_billing', { mode: 'boolean' }).default(false),
	isDefaultShipping: integer('is_default_shipping', { mode: 'boolean' }).default(false),
	createdAt: integer('created_at').notNull()
}, (table) => ({
	contactIdIdx: index('idx_contact_addresses_contact_id').on(table.contactId),
	defaultsIdx: index('idx_contact_addresses_defaults').on(table.contactId, table.isDefaultBilling, table.isDefaultShipping)
}))

// Drizzle inferred types
export type DbContact = typeof contacts.$inferSelect
export type DbNewContact = typeof contacts.$inferInsert
export type DbContactAddress = typeof contactAddresses.$inferSelect
export type DbNewContactAddress = typeof contactAddresses.$inferInsert