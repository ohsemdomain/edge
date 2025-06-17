// _server/routes/contacts.ts
import { eq, like, or, and, desc } from 'drizzle-orm'
import { createArchiveRouter } from '../lib/archiveProcedures'
import { publicProcedure, router } from '../trpc'
import { getDb, schema } from '../db'

// Import shared types and utilities
import type { ContactListResponse } from '~/contacts/api'
import { toApiContacts, toApiContact, toApiContactAddresses, toApiContactAddress } from '~/contacts/transforms'
import { generateContactId, generateAddressId } from '~/contacts/constants'
import { 
	contactCreateSchema, 
	contactUpdateSchema, 
	contactListSchema, 
	contactIdSchema,
	contactAddressCreateSchema,
	contactAddressUpdateSchema,
	addressIdSchema
} from '~/contacts/validation'

const archiveContactsRouter = createArchiveRouter('contacts')

export const contactsRouter = router({
	...archiveContactsRouter,

	list: publicProcedure
		.input(contactListSchema)
		.query(async ({ input, ctx }): Promise<ContactListResponse> => {
			const db = getDb(ctx.env.DB)
			const { search, page, limit, isActive } = input
			const offset = (page - 1) * limit

			const conditions = [eq(schema.contacts.isActive, isActive)]
			
			if (search) {
				conditions.push(
					or(
						like(schema.contacts.companyName, `%${search}%`),
						like(schema.contacts.primaryPhone, `%${search}%`)
					)!
				)
			}

			const results = await db
				.select()
				.from(schema.contacts)
				.where(and(...conditions))
				.orderBy(desc(schema.contacts.createdAt))
				.limit(limit)
				.offset(offset)

			return {
				contacts: toApiContacts(results),
				totalItems: results.length
			}
		}),

	create: publicProcedure
		.input(contactCreateSchema)
		.mutation(async ({ input, ctx }) => {
			const db = getDb(ctx.env.DB)
			const id = generateContactId()
			const createdAt = Math.floor(Date.now() / 1000)

			await db.insert(schema.contacts).values({
				id,
				companyName: input.companyName,
				personIncharge: input.personIncharge,
				primaryPhone: input.primaryPhone,
				email: input.email || null,
				phoneAlt1: input.phoneAlt1 || null,
				phoneAlt2: input.phoneAlt2 || null,
				phoneAlt3: input.phoneAlt3 || null,
				isSupplier: input.isSupplier || false,
				isActive: true,
				createdAt
			})

			// Return the created contact in API format
			const dbContact = {
				id,
				companyName: input.companyName,
				personIncharge: input.personIncharge,
				primaryPhone: input.primaryPhone,
				email: input.email || null,
				phoneAlt1: input.phoneAlt1 || null,
				phoneAlt2: input.phoneAlt2 || null,
				phoneAlt3: input.phoneAlt3 || null,
				isSupplier: input.isSupplier || false,
				isActive: true,
				createdAt
			}

			return toApiContact(dbContact)
		}),

	update: publicProcedure
		.input(contactUpdateSchema)
		.mutation(async ({ input, ctx }) => {
			const db = getDb(ctx.env.DB)

			await db
				.update(schema.contacts)
				.set({
					companyName: input.companyName,
					personIncharge: input.personIncharge,
					primaryPhone: input.primaryPhone,
					email: input.email || null,
					phoneAlt1: input.phoneAlt1 || null,
					phoneAlt2: input.phoneAlt2 || null,
					phoneAlt3: input.phoneAlt3 || null,
					isSupplier: input.isSupplier || false
				})
				.where(eq(schema.contacts.id, input.id))

			return { success: true }
		}),

	delete: publicProcedure
		.input(contactIdSchema)
		.mutation(async ({ input: id, ctx }) => {
			const db = getDb(ctx.env.DB)
			
			// Check for related data in invoices
			const relatedInvoices = await db
				.select({ count: schema.invoices.id })
				.from(schema.invoices)
				.where(eq(schema.invoices.contactId, id))
			
			const invoiceCount = relatedInvoices.length
			
			if (invoiceCount > 0) {
				const invoiceText = invoiceCount === 1 ? 'invoice' : 'invoices'
				throw new Error(`Delete Failed: ${invoiceCount} ${invoiceText} exist`)
			}
			
			// Check for related data in payments
			const relatedPayments = await db
				.select({ count: schema.payments.id })
				.from(schema.payments)
				.where(eq(schema.payments.contactId, id))
			
			const paymentCount = relatedPayments.length
			
			if (paymentCount > 0) {
				const paymentText = paymentCount === 1 ? 'payment' : 'payments'
				throw new Error(`Delete Failed: ${paymentCount} ${paymentText} exist`)
			}
			
			// Delete addresses first (due to foreign key constraint)
			await db.delete(schema.contactAddresses).where(eq(schema.contactAddresses.contactId, id))
			
			// Safe to delete contact
			await db.delete(schema.contacts).where(eq(schema.contacts.id, id))
			
			return { success: true }
		}),

	// Address management procedures
	listAddresses: publicProcedure
		.input(contactIdSchema)
		.query(async ({ input: contactId, ctx }) => {
			const db = getDb(ctx.env.DB)
			
			const results = await db
				.select()
				.from(schema.contactAddresses)
				.where(eq(schema.contactAddresses.contactId, contactId))
				.orderBy(desc(schema.contactAddresses.createdAt))

			return toApiContactAddresses(results)
		}),

	createAddress: publicProcedure
		.input(contactAddressCreateSchema)
		.mutation(async ({ input, ctx }) => {
			const db = getDb(ctx.env.DB)
			const id = generateAddressId()
			const createdAt = Math.floor(Date.now() / 1000)

			await db.insert(schema.contactAddresses).values({
				id,
				contactId: input.contactId,
				receiver: input.receiver,
				addressLine1: input.addressLine1,
				addressLine2: input.addressLine2 || null,
				addressLine3: input.addressLine3 || null,
				addressLine4: input.addressLine4 || null,
				postcode: input.postcode,
				city: input.city,
				state: input.state,
				country: input.country,
				isDefaultBilling: input.isDefaultBilling || false,
				isDefaultShipping: input.isDefaultShipping || false,
				createdAt
			})

			// Return the created address in API format
			const dbAddress = {
				id,
				contactId: input.contactId,
				receiver: input.receiver,
				addressLine1: input.addressLine1,
				addressLine2: input.addressLine2 || null,
				addressLine3: input.addressLine3 || null,
				addressLine4: input.addressLine4 || null,
				postcode: input.postcode,
				city: input.city,
				state: input.state,
				country: input.country,
				isDefaultBilling: input.isDefaultBilling || false,
				isDefaultShipping: input.isDefaultShipping || false,
				createdAt
			}

			return toApiContactAddress(dbAddress)
		}),

	updateAddress: publicProcedure
		.input(contactAddressUpdateSchema)
		.mutation(async ({ input, ctx }) => {
			const db = getDb(ctx.env.DB)

			await db
				.update(schema.contactAddresses)
				.set({
					receiver: input.receiver,
					addressLine1: input.addressLine1,
					addressLine2: input.addressLine2 || null,
					addressLine3: input.addressLine3 || null,
					addressLine4: input.addressLine4 || null,
					postcode: input.postcode,
					city: input.city,
					state: input.state,
					country: input.country,
					isDefaultBilling: input.isDefaultBilling || false,
					isDefaultShipping: input.isDefaultShipping || false
				})
				.where(eq(schema.contactAddresses.id, input.id))

			return { success: true }
		}),

	deleteAddress: publicProcedure
		.input(addressIdSchema)
		.mutation(async ({ input: id, ctx }) => {
			const db = getDb(ctx.env.DB)
			
			await db.delete(schema.contactAddresses).where(eq(schema.contactAddresses.id, id))
			
			return { success: true }
		})
})