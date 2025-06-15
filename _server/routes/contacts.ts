// _server/routes/contacts.ts
import { z } from 'zod'
import { createArchiveRouter } from '../lib/archiveProcedures'
import { publicProcedure, router } from '../trpc'

interface ContactRow {
	id: string
	legal_name: string
	is_supplier: boolean
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
					is_supplier: Boolean(r.is_supplier),
					is_active: Boolean(r.is_active),
					createdAt: new Date(r.created_at * 1000)
				})),
				totalItems: results.length
			}
		}),

	create: publicProcedure
		.input(
			z.object({
				legal_name: z.string().min(1),
				is_supplier: z.boolean().default(false)
			})
		)
		.mutation(async ({ input, ctx }) => {
			const { DB } = ctx.env
			const id =
				`C${Date.now().toString().slice(-1)}${Math.floor(100000 + Math.random() * 900000)}`.replace(
					/0/g,
					() => Math.floor(Math.random() * 9 + 1).toString()
				)
			const createdAt = Math.floor(Date.now() / 1000)

			await DB.prepare(
				'INSERT INTO contacts (id, legal_name, is_supplier, is_active, created_at) VALUES (?, ?, ?, ?, ?)'
			)
				.bind(id, input.legal_name, input.is_supplier, true, createdAt)
				.run()

			return {
				id,
				legal_name: input.legal_name,
				is_supplier: input.is_supplier,
				is_active: true,
				createdAt: new Date(createdAt * 1000)
			}
		}),

	update: publicProcedure
		.input(
			z.object({
				id: z.string(),
				legal_name: z.string().min(1),
				is_supplier: z.boolean()
			})
		)
		.mutation(async ({ input, ctx }) => {
			const { DB } = ctx.env

			await DB.prepare('UPDATE contacts SET legal_name = ?, is_supplier = ? WHERE id = ?')
				.bind(input.legal_name, input.is_supplier, input.id)
				.run()

			return { success: true }
		})
})
