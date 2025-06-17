// _server/routes/items.ts
import { z } from 'zod'
import { createArchiveRouter } from '../lib/archiveProcedures'
import { publicProcedure, router } from '../trpc'

interface ItemRow {
	id: string
	name: string
	description: string
	unit_price: number
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
		.input(z.object({ 
			name: z.string().min(1), 
			description: z.string().min(1),
			unit_price: z.number().positive()
		}))
		.mutation(async ({ input, ctx }) => {
			const { DB } = ctx.env
			const id = crypto.randomUUID().slice(0, 8)
			const createdAt = Math.floor(Date.now() / 1000)

			await DB.prepare('INSERT INTO items (id, name, description, unit_price, is_active, created_at) VALUES (?, ?, ?, ?, ?, ?)')
				.bind(id, input.name, input.description, input.unit_price, true, createdAt)
				.run()

			return {
				id,
				name: input.name,
				description: input.description,
				unit_price: input.unit_price,
				is_active: true,
				createdAt: new Date(createdAt * 1000)
			}
		}),

	update: publicProcedure
		.input(
			z.object({
				id: z.string(),
				name: z.string().min(1),
				description: z.string().min(1),
				unit_price: z.number().positive()
			})
		)
		.mutation(async ({ input, ctx }) => {
			const { DB } = ctx.env

			await DB.prepare('UPDATE items SET name = ?, description = ?, unit_price = ? WHERE id = ?').bind(input.name, input.description, input.unit_price, input.id).run()

			return { success: true }
		}),

	delete: publicProcedure
		.input(z.string())
		.mutation(async ({ input: id, ctx }) => {
			const { DB } = ctx.env
			
			// Check for related data in invoice_items
			const { results } = await DB.prepare('SELECT COUNT(*) as count FROM invoice_items WHERE item_id = ?')
				.bind(id)
				.all()
			
			const invoiceItemCount = (results[0] as any)?.count || 0
			
			if (invoiceItemCount > 0) {
				const itemText = invoiceItemCount === 1 ? 'invoice' : 'invoices'
				throw new Error(`Delete Failed: Used in ${itemText}`)
			}
			
			// Safe to delete
			await DB.prepare('DELETE FROM items WHERE id = ?')
				.bind(id)
				.run()
			
			return { success: true }
		})
})
