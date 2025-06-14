// _server/routes/items.ts
import { z } from 'zod'
import { publicProcedure, router } from '../trpc'

// Define the database row type
interface ItemRow {
	id: string
	name: string
	status: string
	created_at: number
}

export const itemsRouter = router({
	list: publicProcedure
		.input(
			z.object({
				search: z.string().optional(),
				page: z.number().default(1),
				limit: z.number().default(10),
				status: z.enum(['active', 'inactive']).default('active')
			})
		)
		.query(async ({ input, ctx }) => {
			const { DB } = ctx.env
			const offset = (input.page - 1) * input.limit

			// Build query
			let query = 'SELECT * FROM items WHERE status = ? ORDER BY created_at DESC'
			const params: (string | number)[] = [input.status]

			// Add search filter if provided
			if (input.search) {
				query = 'SELECT * FROM items WHERE status = ? AND name LIKE ? ORDER BY created_at DESC'
				params.push(`%${input.search}%`)
			}

			// Add pagination
			query += ' LIMIT ? OFFSET ?'
			params.push(input.limit, offset)

			const { results } = await DB.prepare(query)
				.bind(...params)
				.all<ItemRow>()

			// Get total count only if needed for pagination UI
			const totalItems = results.length

			return {
				items: results.map((item) => ({
					id: item.id,
					name: item.name,
					status: item.status,
					createdAt: new Date(item.created_at * 1000)
				})),
				totalPages: 1, // Simplified since clients use high limits
				totalItems
			}
		}),

	create: publicProcedure
		.input(z.object({ name: z.string().min(1) }))
		.mutation(async ({ input, ctx }) => {
			const { DB } = ctx.env
			const id = crypto.randomUUID().slice(0, 8)
			const createdAt = Math.floor(Date.now() / 1000) // Unix timestamp in seconds

			await DB.prepare('INSERT INTO items (id, name, status, created_at) VALUES (?, ?, ?, ?)')
				.bind(id, input.name, 'active', createdAt)
				.run()

			return {
				id,
				name: input.name,
				status: 'active',
				createdAt: new Date(createdAt * 1000)
			}
		}),

	update: publicProcedure
		.input(
			z.object({
				id: z.string(),
				name: z.string().min(1)
			})
		)
		.mutation(async ({ input, ctx }) => {
			const { DB } = ctx.env

			// Check if item exists
			const existing = await DB.prepare('SELECT * FROM items WHERE id = ?')
				.bind(input.id)
				.first<ItemRow>()
			if (!existing) throw new Error('Item not found')

			await DB.prepare('UPDATE items SET name = ? WHERE id = ?').bind(input.name, input.id).run()

			return {
				id: input.id,
				name: input.name,
				status: existing.status,
				createdAt: new Date(existing.created_at * 1000)
			}
		}),

	updateStatus: publicProcedure
		.input(
			z.object({
				id: z.string(),
				status: z.enum(['active', 'inactive'])
			})
		)
		.mutation(async ({ input, ctx }) => {
			const { DB } = ctx.env

			// Check if item exists
			const existing = await DB.prepare('SELECT * FROM items WHERE id = ?')
				.bind(input.id)
				.first<ItemRow>()
			if (!existing) throw new Error('Item not found')

			await DB.prepare('UPDATE items SET status = ? WHERE id = ?')
				.bind(input.status, input.id)
				.run()

			return {
				id: input.id,
				name: existing.name,
				status: input.status,
				createdAt: new Date(existing.created_at * 1000)
			}
		}),

	delete: publicProcedure.input(z.string()).mutation(async ({ input: id, ctx }) => {
		const { DB } = ctx.env

		// Check if item exists
		const existing = await DB.prepare('SELECT * FROM items WHERE id = ?').bind(id).first<ItemRow>()
		if (!existing) throw new Error('Item not found')

		await DB.prepare('DELETE FROM items WHERE id = ?').bind(id).run()

		return { success: true }
	})
})
