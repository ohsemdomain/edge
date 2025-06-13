import { z } from 'zod'
import { publicProcedure, router } from '../trpc'

// In-memory store for demo (replace with D1/KV in production)
const items: Array<{ id: string; name: string; createdAt: Date }> = []

export const itemsRouter = router({
	list: publicProcedure
		.input(
			z.object({
				search: z.string().optional(),
				page: z.number().default(1),
				limit: z.number().default(10)
			})
		)
		.query(({ input }) => {
			let filtered = items

			if (input.search) {
				filtered = items.filter((item) => item.name.toLowerCase().includes(input.search!.toLowerCase()))
			}

			const start = (input.page - 1) * input.limit
			const paginatedItems = filtered.slice(start, start + input.limit)

			return {
				items: paginatedItems,
				totalPages: Math.ceil(filtered.length / input.limit),
				totalItems: filtered.length
			}
		}),

	create: publicProcedure.input(z.object({ name: z.string().min(1) })).mutation(({ input }) => {
		const newItem = {
			id: crypto.randomUUID(),
			name: input.name,
			createdAt: new Date()
		}
		items.push(newItem)
		return newItem
	}),

	update: publicProcedure
		.input(
			z.object({
				id: z.string(),
				name: z.string().min(1)
			})
		)
		.mutation(({ input }) => {
			const index = items.findIndex((item) => item.id === input.id)
			if (index === -1) throw new Error('Item not found')

			items[index] = { ...items[index], name: input.name }
			return items[index]
		}),

	delete: publicProcedure.input(z.string()).mutation(({ input: id }) => {
		const index = items.findIndex((item) => item.id === id)
		if (index === -1) throw new Error('Item not found')

		items.splice(index, 1)
		return { success: true }
	})
})
