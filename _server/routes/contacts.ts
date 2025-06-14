import { z } from 'zod'
import { publicProcedure, router } from '../trpc'

// Updated contact type with status
const contacts: Array<{
	id: string
	name: string
	phone: string
	status: 'active' | 'inactive'
	createdAt: Date
}> = []

export const contactsRouter = router({
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
			let filtered = contacts.filter((c) => c.status === input.status)

			// Add search filter if provided
			if (input.search) {
				filtered = filtered.filter(
					(contact) => contact.name.toLowerCase().includes(input.search!.toLowerCase()) || contact.phone.includes(input.search!)
				)
			}

			// Sort newest first
			const sorted = [...filtered].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())

			// Apply pagination
			const start = (input.page - 1) * input.limit
			const paginatedContacts = sorted.slice(start, start + input.limit)

			return {
				contacts: paginatedContacts,
				totalPages: 1, // Simplified since clients use high limits
				totalItems: paginatedContacts.length
			}
		}),

	create: publicProcedure
		.input(
			z.object({
				name: z.string().min(1),
				phone: z.string().min(1)
			})
		)
		.mutation(({ input }) => {
			const newContact = {
				id: crypto.randomUUID(),
				name: input.name,
				phone: input.phone,
				status: 'active' as const,
				createdAt: new Date()
			}
			contacts.push(newContact)
			return newContact
		}),

	update: publicProcedure
		.input(
			z.object({
				id: z.string(),
				name: z.string().min(1),
				phone: z.string().min(1)
			})
		)
		.mutation(({ input }) => {
			const index = contacts.findIndex((c) => c.id === input.id)
			if (index === -1) throw new Error('Contact not found')

			contacts[index] = { ...contacts[index], name: input.name, phone: input.phone }
			return contacts[index]
		}),

	updateStatus: publicProcedure
		.input(
			z.object({
				id: z.string(),
				status: z.enum(['active', 'inactive'])
			})
		)
		.mutation(({ input }) => {
			const index = contacts.findIndex((c) => c.id === input.id)
			if (index === -1) throw new Error('Contact not found')

			contacts[index] = { ...contacts[index], status: input.status }
			return contacts[index]
		}),

	delete: publicProcedure.input(z.string()).mutation(({ input: id }) => {
		const index = contacts.findIndex((c) => c.id === id)
		if (index === -1) throw new Error('Contact not found')

		contacts.splice(index, 1)
		return { success: true }
	})
})
