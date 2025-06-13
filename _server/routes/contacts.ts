import { z } from 'zod'
import { publicProcedure, router } from '../trpc'

// In-memory store for demo (replace with D1/KV in production)
const contacts: Array<{ id: string; name: string; phone: string; createdAt: Date }> = []

export const contactsRouter = router({
	list: publicProcedure
		.input(
			z.object({
				search: z.string().optional(),
				page: z.number().default(1),
				limit: z.number().default(10)
			})
		)
		.query(({ input }) => {
			let filtered = contacts

			if (input.search) {
				filtered = contacts.filter(
					(contact) => contact.name.toLowerCase().includes(input.search!.toLowerCase()) || contact.phone.includes(input.search!)
				)
			}

			// Always sort newest first
			const sorted = [...filtered].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())

			const start = (input.page - 1) * input.limit
			const paginatedContacts = sorted.slice(start, start + input.limit)

			return {
				contacts: paginatedContacts,
				totalPages: Math.ceil(sorted.length / input.limit),
				totalItems: sorted.length
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

	delete: publicProcedure.input(z.string()).mutation(({ input: id }) => {
		const index = contacts.findIndex((c) => c.id === id)
		if (index === -1) throw new Error('Contact not found')

		contacts.splice(index, 1)
		return { success: true }
	})
})
