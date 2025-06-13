import { z } from 'zod'
import { publicProcedure, router } from '../trpc'

// Updated item type with status
const items: Array<{
	id: string
	name: string
	status: 'active' | 'inactive'
	createdAt: Date
}> = []

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
		.query(({ input }) => {
			let filtered = items.filter((i) => i.status === input.status)

			if (input.search) {
				filtered = filtered.filter((item) => item.name.toLowerCase().includes(input.search!.toLowerCase()))
			}

			// Always sort newest first
			const sorted = [...filtered].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())

			const start = (input.page - 1) * input.limit
			const paginatedItems = sorted.slice(start, start + input.limit)

			return {
				items: paginatedItems,
				totalPages: Math.ceil(sorted.length / input.limit),
				totalItems: sorted.length
			}
		}),

	create: publicProcedure.input(z.object({ name: z.string().min(1) })).mutation(({ input }) => {
		const newItem = {
			id: crypto.randomUUID(),
			name: input.name,
			status: 'active' as const,
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

	updateStatus: publicProcedure
		.input(
			z.object({
				id: z.string(),
				status: z.enum(['active', 'inactive'])
			})
		)
		.mutation(({ input }) => {
			const index = items.findIndex((i) => i.id === input.id)
			if (index === -1) throw new Error('Item not found')

			items[index] = { ...items[index], status: input.status }
			return items[index]
		}),

	delete: publicProcedure.input(z.string()).mutation(({ input: id }) => {
		const index = items.findIndex((item) => item.id === id)
		if (index === -1) throw new Error('Item not found')

		items.splice(index, 1)
		return { success: true }
	})
})
