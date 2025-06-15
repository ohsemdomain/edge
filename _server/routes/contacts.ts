// _server/routes/contacts.ts
import { z } from 'zod'
import { createArchiveRouter } from '../lib/archiveProcedures'
import { publicProcedure, router } from '../trpc'

interface ContactRow {
	id: string
	company_name: string
	person_incharge: string
	primary_phone: string
	email: string | null
	phone_alt_1: string | null
	phone_alt_2: string | null
	phone_alt_3: string | null
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
				query += ' AND (company_name LIKE ? OR primary_phone LIKE ? OR phone_alt_1 LIKE ? OR phone_alt_2 LIKE ? OR phone_alt_3 LIKE ?)'
				params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`)
			}

			query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?'
			params.push(limit, offset)

			const { results } = await DB.prepare(query)
				.bind(...params)
				.all<ContactRow>()

			return {
				contacts: results.map((r) => ({
					id: r.id,
					company_name: r.company_name,
					person_incharge: r.person_incharge,
					primary_phone: r.primary_phone,
					email: r.email,
					phone_alt_1: r.phone_alt_1,
					phone_alt_2: r.phone_alt_2,
					phone_alt_3: r.phone_alt_3,
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
				company_name: z.string().min(1),
				person_incharge: z.string().min(1),
				primary_phone: z.string().min(1),
				email: z.string().email().optional(),
				phone_alt_1: z.string().optional(),
				phone_alt_2: z.string().optional(),
				phone_alt_3: z.string().optional(),
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
				'INSERT INTO contacts (id, company_name, person_incharge, primary_phone, email, phone_alt_1, phone_alt_2, phone_alt_3, is_supplier, is_active, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
			)
				.bind(id, input.company_name, input.person_incharge, input.primary_phone, input.email || null, input.phone_alt_1 || null, input.phone_alt_2 || null, input.phone_alt_3 || null, input.is_supplier, true, createdAt)
				.run()

			return {
				id,
				company_name: input.company_name,
				person_incharge: input.person_incharge,
				primary_phone: input.primary_phone,
				email: input.email || null,
				phone_alt_1: input.phone_alt_1 || null,
				phone_alt_2: input.phone_alt_2 || null,
				phone_alt_3: input.phone_alt_3 || null,
				is_supplier: input.is_supplier,
				is_active: true,
				createdAt: new Date(createdAt * 1000)
			}
		}),

	update: publicProcedure
		.input(
			z.object({
				id: z.string(),
				company_name: z.string().min(1),
				person_incharge: z.string().min(1),
				primary_phone: z.string().min(1),
				email: z.string().email().optional(),
				phone_alt_1: z.string().optional(),
				phone_alt_2: z.string().optional(),
				phone_alt_3: z.string().optional(),
				is_supplier: z.boolean()
			})
		)
		.mutation(async ({ input, ctx }) => {
			const { DB } = ctx.env

			await DB.prepare('UPDATE contacts SET company_name = ?, person_incharge = ?, primary_phone = ?, email = ?, phone_alt_1 = ?, phone_alt_2 = ?, phone_alt_3 = ?, is_supplier = ? WHERE id = ?')
				.bind(input.company_name, input.person_incharge, input.primary_phone, input.email || null, input.phone_alt_1 || null, input.phone_alt_2 || null, input.phone_alt_3 || null, input.is_supplier, input.id)
				.run()

			return { success: true }
		})
})
