// _server/routes/contacts.ts
import { z } from 'zod'
import { createArchiveRouter } from '../lib/archiveProcedures'
import { publicProcedure, router } from '../trpc'

interface ContactRow {
	id: string
	name: string
	phone: string
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
				query += ' AND (name LIKE ? OR phone LIKE ?)'
				params.push(`%${search}%`, `%${search}%`)
			}

			query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?'
			params.push(limit, offset)

			const { results } = await DB.prepare(query)
				.bind(...params)
				.all<ContactRow>()

			return {
				contacts: results.map((r) => ({
					id: r.id,
					name: r.name,
					phone: r.phone,
					is_active: r.is_active,
					createdAt: new Date(r.created_at * 1000)
				})),
				totalItems: results.length
			}
		}),

	create: publicProcedure
		.input(
			z.object({
				name: z.string().min(1),
				phone: z.string().min(1)
			})
		)
		.mutation(async ({ input, ctx }) => {
			const { DB } = ctx.env
			const id = crypto.randomUUID()
			const createdAt = Math.floor(Date.now() / 1000)

			await DB.prepare(
				'INSERT INTO contacts (id, name, phone, is_active, created_at) VALUES (?, ?, ?, ?, ?)'
			)
				.bind(id, input.name, input.phone, true, createdAt)
				.run()

			return {
				id,
				name: input.name,
				phone: input.phone,
				is_active: true,
				createdAt: new Date(createdAt * 1000)
			}
		}),

	update: publicProcedure
		.input(
			z.object({
				id: z.string(),
				name: z.string().min(1),
				phone: z.string().min(1)
			})
		)
		.mutation(async ({ input, ctx }) => {
			const { DB } = ctx.env

			await DB.prepare('UPDATE contacts SET name = ?, phone = ? WHERE id = ?')
				.bind(input.name, input.phone, input.id)
				.run()

			return { success: true }
		})
})
