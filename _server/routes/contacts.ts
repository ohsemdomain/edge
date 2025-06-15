// _server/routes/contacts.ts
import { z } from 'zod'
import { createArchiveRouter } from '../lib/archiveProcedures'
import { publicProcedure, router } from '../trpc'

interface ContactRow {
	id: string
	legal_name: string
	contact_type: string
	is_active: boolean
	created_at: number
}

const archiveContactsRouter = createArchiveRouter('contacts')

export const contactsRouter = router({
	...archiveContactsRouter,

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

			let query = 'SELECT * FROM contacts WHERE is_active = ?'
			const params: (string | number | boolean)[] = [isActive]

			if (search) {
				query += ' AND legal_name LIKE ?'
				params.push(`%${search}%`)
			}

			query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?'
			params.push(limit, offset)

			const { results } = await DB.prepare(query)
				.bind(...params)
				.all<ContactRow>()

			return {
				contacts: results.map((r) => ({
					id: r.id,
					legal_name: r.legal_name,
					contact_type: r.contact_type,
					is_active: r.is_active,
					createdAt: new Date(r.created_at * 1000)
				})),
				totalItems: results.length
			}
		}),

	create: publicProcedure
		.input(
			z.object({
				legal_name: z.string().min(1),
				contact_type: z.string().default('client')
			})
		)
		.mutation(async ({ input, ctx }) => {
			const { DB } = ctx.env
			const id = crypto.randomUUID()
			const createdAt = Math.floor(Date.now() / 1000)

			await DB.prepare(
				'INSERT INTO contacts (id, legal_name, contact_type, is_active, created_at) VALUES (?, ?, ?, ?, ?)'
			)
				.bind(id, input.legal_name, input.contact_type, true, createdAt)
				.run()

			return {
				id,
				legal_name: input.legal_name,
				contact_type: input.contact_type,
				is_active: true,
				createdAt: new Date(createdAt * 1000)
			}
		}),

	update: publicProcedure
		.input(
			z.object({
				id: z.string(),
				legal_name: z.string().min(1),
				contact_type: z.string().min(1)
			})
		)
		.mutation(async ({ input, ctx }) => {
			const { DB } = ctx.env

			await DB.prepare('UPDATE contacts SET legal_name = ?, contact_type = ? WHERE id = ?')
				.bind(input.legal_name, input.contact_type, input.id)
				.run()

			return { success: true }
		})
})
