// _server/routes/items.ts
import { eq, like, and, desc } from 'drizzle-orm'
import { createArchiveRouter } from '../lib/archiveProcedures'
import { publicProcedure, router } from '../trpc'
import { getDb, schema } from '../db'

// Import shared types and utilities
import type { ItemListResponse } from '~/items/api'
import { toApiItems, toApiItem } from '~/items/transforms'
import { generateItemId } from '~/items/constants'
import { 
	itemCreateSchema, 
	itemUpdateSchema, 
	itemListSchema, 
	itemIdSchema 
} from '~/items/validation'

const archiveItemsRouter = createArchiveRouter('items')

export const itemsRouter = router({
	...archiveItemsRouter,

	list: publicProcedure
		.input(itemListSchema)
		.query(async ({ input, ctx }): Promise<ItemListResponse> => {
			const db = getDb(ctx.env.DB)
			const { search, page, limit, isActive } = input
			const offset = (page - 1) * limit

			const conditions = [eq(schema.items.isActive, isActive)]
			
			if (search) {
				conditions.push(like(schema.items.name, `%${search}%`))
			}

			const results = await db
				.select()
				.from(schema.items)
				.where(and(...conditions))
				.orderBy(desc(schema.items.createdAt))
				.limit(limit)
				.offset(offset)

			return {
				items: toApiItems(results),
				totalItems: results.length
			}
		}),

	create: publicProcedure
		.input(itemCreateSchema)
		.mutation(async ({ input, ctx }) => {
			const db = getDb(ctx.env.DB)
			const id = generateItemId()
			const createdAt = Math.floor(Date.now() / 1000)

			await db.insert(schema.items).values({
				id,
				name: input.name,
				description: input.description,
				unitPrice: input.unitPrice,
				isActive: true,
				createdAt
			})

			// Return the created item in API format
			const dbItem = {
				id,
				name: input.name,
				description: input.description,
				unitPrice: input.unitPrice,
				isActive: true,
				createdAt
			}

			return toApiItem(dbItem)
		}),

	update: publicProcedure
		.input(itemUpdateSchema)
		.mutation(async ({ input, ctx }) => {
			const db = getDb(ctx.env.DB)

			await db
				.update(schema.items)
				.set({
					name: input.name,
					description: input.description,
					unitPrice: input.unitPrice
				})
				.where(eq(schema.items.id, input.id))

			return { success: true }
		}),

	delete: publicProcedure
		.input(itemIdSchema)
		.mutation(async ({ input: id, ctx }) => {
			const db = getDb(ctx.env.DB)
			
			// Check for related data in invoice_items
			const relatedItems = await db
				.select({ count: schema.invoiceItems.id })
				.from(schema.invoiceItems)
				.where(eq(schema.invoiceItems.itemId, id))
			
			const invoiceItemCount = relatedItems.length
			
			if (invoiceItemCount > 0) {
				const itemText = invoiceItemCount === 1 ? 'invoice' : 'invoices'
				throw new Error(`Delete Failed: Used in ${itemText}`)
			}
			
			// Safe to delete
			await db.delete(schema.items).where(eq(schema.items.id, id))
			
			return { success: true }
		})
})