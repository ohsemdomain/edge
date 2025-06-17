// _server/lib/archiveProcedures.ts
import { z } from 'zod'
import { eq, sql } from 'drizzle-orm'
import { publicProcedure } from '../trpc'
import { getDb, schema } from '../db'

// Map table names to their Drizzle schema tables
const tableMap = {
	items: schema.items,
	contacts: schema.contacts,
	invoices: schema.invoices,
	payments: schema.payments
} as const

type TableName = keyof typeof tableMap

// Create archive-specific procedures for any table with is_active pattern
export const createArchiveRouter = (tableName: TableName) => {
	const table = tableMap[tableName]
	
	return {
		toggleActive: publicProcedure
			.input(z.object({ id: z.string() }))
			.mutation(async ({ input, ctx }) => {
				const db = getDb(ctx.env.DB)

				// Toggle between active/archived state using SQL template
				await db
					.update(table)
					.set({ 
						isActive: sql`NOT ${table.isActive}` 
					})
					.where(eq(table.id, input.id))

				return { success: true }
			}),

		delete: publicProcedure.input(z.string()).mutation(async ({ input: id, ctx }) => {
			const db = getDb(ctx.env.DB)

			// Permanently delete (usually from archive)
			await db.delete(table).where(eq(table.id, id))

			return { success: true }
		})
	}
}