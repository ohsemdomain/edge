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
				isActive: z.boolean().default(true)
			})
		)
		.query(async ({ input, ctx }) => {
			const { DB } = ctx.env
			const { isActive } = input

			const query = 'SELECT * FROM contacts WHERE is_active = ? ORDER BY created_at DESC'
			const params: (boolean)[] = [isActive]

			const { results } = await DB.prepare(query)
				.bind(...params)
				.all<ContactRow>()

			return {
				contacts: results.map((r) => ({
					id: r.id,
					name: r.company_name, // Add name field for invoices
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
				email: z.string().email().optional().or(z.literal('')),
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
				.bind(
					id,
					input.company_name,
					input.person_incharge,
					input.primary_phone,
					input.email || null,
					input.phone_alt_1 || null,
					input.phone_alt_2 || null,
					input.phone_alt_3 || null,
					input.is_supplier,
					true,
					createdAt
				)
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
				email: z.string().email().optional().or(z.literal('')),
				phone_alt_1: z.string().optional(),
				phone_alt_2: z.string().optional(),
				phone_alt_3: z.string().optional(),
				is_supplier: z.boolean()
			})
		)
		.mutation(async ({ input, ctx }) => {
			const { DB } = ctx.env

			await DB.prepare(
				'UPDATE contacts SET company_name = ?, person_incharge = ?, primary_phone = ?, email = ?, phone_alt_1 = ?, phone_alt_2 = ?, phone_alt_3 = ?, is_supplier = ? WHERE id = ?'
			)
				.bind(
					input.company_name,
					input.person_incharge,
					input.primary_phone,
					input.email || null,
					input.phone_alt_1 || null,
					input.phone_alt_2 || null,
					input.phone_alt_3 || null,
					input.is_supplier,
					input.id
				)
				.run()

			return { success: true }
		}),

	// Address methods

	getAddresses: publicProcedure
		.input(z.object({ contactId: z.string() }))
		.query(async ({ input, ctx }) => {
			const { DB } = ctx.env

			const { results } = await DB.prepare(
				'SELECT * FROM contact_addresses WHERE contact_id = ? ORDER BY created_at DESC'
			)
				.bind(input.contactId)
				.all()

			return results
		}),

	addAddress: publicProcedure
		.input(
			z.object({
				contactId: z.string(),
				receiver: z.string().min(1),
				address_line1: z.string().min(1),
				address_line2: z.string().optional(),
				address_line3: z.string().optional(),
				address_line4: z.string().optional(),
				postcode: z.string().min(1),
				city: z.string().min(1),
				state: z.string().min(1),
				country: z.string().min(1),
				is_default_billing: z.boolean().default(false),
				is_default_shipping: z.boolean().default(false)
			})
		)
		.mutation(async ({ input, ctx }) => {
			const { DB } = ctx.env
			const id = crypto.randomUUID().slice(0, 8)
			const createdAt = Math.floor(Date.now() / 1000)

			// If setting as default, unset other defaults first
			if (input.is_default_billing) {
				await DB.prepare(
					'UPDATE contact_addresses SET is_default_billing = FALSE WHERE contact_id = ?'
				)
					.bind(input.contactId)
					.run()
			}

			if (input.is_default_shipping) {
				await DB.prepare(
					'UPDATE contact_addresses SET is_default_shipping = FALSE WHERE contact_id = ?'
				)
					.bind(input.contactId)
					.run()
			}

			await DB.prepare(
				`INSERT INTO contact_addresses (
	  id, contact_id, receiver, address_line1, address_line2, 
	  address_line3, address_line4, postcode, city, state, 
	  country, is_default_billing, is_default_shipping, created_at
	) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
			)
				.bind(
					id,
					input.contactId,
					input.receiver,
					input.address_line1,
					input.address_line2 || null,
					input.address_line3 || null,
					input.address_line4 || null,
					input.postcode,
					input.city,
					input.state,
					input.country,
					input.is_default_billing,
					input.is_default_shipping,
					createdAt
				)
				.run()

			return { id, ...input, created_at: createdAt }
		}),

	updateAddress: publicProcedure
		.input(
			z.object({
				id: z.string(),
				contactId: z.string(),
				receiver: z.string().min(1),
				address_line1: z.string().min(1),
				address_line2: z.string().optional(),
				address_line3: z.string().optional(),
				address_line4: z.string().optional(),
				postcode: z.string().min(1),
				city: z.string().min(1),
				state: z.string().min(1),
				country: z.string().min(1),
				is_default_billing: z.boolean(),
				is_default_shipping: z.boolean()
			})
		)
		.mutation(async ({ input, ctx }) => {
			const { DB } = ctx.env

			// Handle default toggles
			if (input.is_default_billing) {
				await DB.prepare(
					'UPDATE contact_addresses SET is_default_billing = FALSE WHERE contact_id = ? AND id != ?'
				)
					.bind(input.contactId, input.id)
					.run()
			}

			if (input.is_default_shipping) {
				await DB.prepare(
					'UPDATE contact_addresses SET is_default_shipping = FALSE WHERE contact_id = ? AND id != ?'
				)
					.bind(input.contactId, input.id)
					.run()
			}

			await DB.prepare(
				`UPDATE contact_addresses SET 
	  receiver = ?, address_line1 = ?, address_line2 = ?, 
	  address_line3 = ?, address_line4 = ?, postcode = ?, 
	  city = ?, state = ?, country = ?, 
	  is_default_billing = ?, is_default_shipping = ?
	WHERE id = ?`
			)
				.bind(
					input.receiver,
					input.address_line1,
					input.address_line2 || null,
					input.address_line3 || null,
					input.address_line4 || null,
					input.postcode,
					input.city,
					input.state,
					input.country,
					input.is_default_billing,
					input.is_default_shipping,
					input.id
				)
				.run()

			return { success: true }
		}),

	deleteAddress: publicProcedure.input(z.string()).mutation(async ({ input: id, ctx }) => {
		const { DB } = ctx.env
		await DB.prepare('DELETE FROM contact_addresses WHERE id = ?').bind(id).run()
		return { success: true }
	})
})
