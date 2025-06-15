// _server/routes/items.ts
import { z } from 'zod'
import { createArchiveRouter } from '../lib/archiveProcedures'
import { publicProcedure, router } from '../trpc'

interface ItemRow {
	id: string
	name: string
	is_active: boolean
	created_at: number
}

const archiveItemsRouter = createArchiveRouter('items')

export const itemsRouter = router({
	...archiveItemsRouter,

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

			let query = 'SELECT * FROM items WHERE is_active = ?'
			const params: (string | number | boolean)[] = [isActive]

			if (search) {
				query += ' AND name LIKE ?'
				params.push(`%${search}%`)
			}

			query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?'
			params.push(limit, offset)

			const { results } = await DB.prepare(query)
				.bind(...params)
				.all<ItemRow>() // This is where ItemRow is used!

			return {
				items: results.map((item) => ({
					...item,
					createdAt: new Date(item.created_at * 1000)
				})),
				totalItems: results.length
			}
		}),

	create: publicProcedure
		.input(z.object({ name: z.string().min(1) }))
		.mutation(async ({ input, ctx }) => {
			const { DB } = ctx.env
			const id = crypto.randomUUID().slice(0, 8)
			const createdAt = Math.floor(Date.now() / 1000)

			await DB.prepare('INSERT INTO items (id, name, is_active, created_at) VALUES (?, ?, ?, ?)')
				.bind(id, input.name, true, createdAt)
				.run()

			return {
				id,
				name: input.name,
				is_active: true,
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

			await DB.prepare('UPDATE items SET name = ? WHERE id = ?').bind(input.name, input.id).run()

			return { success: true }
		})
})
