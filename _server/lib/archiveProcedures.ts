// _server/lib/archiveProcedures.ts
import { z } from 'zod'
import { publicProcedure } from '../trpc'

// Create archive-specific procedures for any table with is_active pattern
export const createArchiveRouter = (tableName: string) => {
	return {
		toggleActive: publicProcedure
			.input(z.object({ id: z.string() }))
			.mutation(async ({ input, ctx }) => {
				const { DB } = ctx.env

				// Toggle between active/archived state
				await DB.prepare(`UPDATE ${tableName} SET is_active = NOT is_active WHERE id = ?`)
					.bind(input.id)
					.run()

				return { success: true }
			}),

		delete: publicProcedure.input(z.string()).mutation(async ({ input: id, ctx }) => {
			const { DB } = ctx.env

			// Permanently delete (usually from archive)
			await DB.prepare(`DELETE FROM ${tableName} WHERE id = ?`).bind(id).run()

			return { success: true }
		})
	}
}
