// Database schema and types for items
import { integer, real, sqliteTable, text, index } from 'drizzle-orm/sqlite-core'

// Items table schema - using camelCase for TypeScript properties
export const items = sqliteTable('items', {
	id: text('id').primaryKey(),
	name: text('name').notNull(),
	description: text('description').notNull(),
	unitPrice: real('unit_price').notNull(),
	isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
	createdAt: integer('created_at').notNull()
}, (table) => ({
	activeIdx: index('idx_items_active').on(table.isActive),
	createdAtIdx: index('idx_items_created_at').on(table.createdAt)
}))

// Drizzle inferred types
export type DbItem = typeof items.$inferSelect
export type DbNewItem = typeof items.$inferInsert