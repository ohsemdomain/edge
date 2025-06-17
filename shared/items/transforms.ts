// Transform utilities for converting between database and API formats
import type { Item } from './api'
import type { DbItem } from './database'

// Convert database item to API item format
export const toApiItem = (dbItem: DbItem): Item => ({
	id: dbItem.id,
	name: dbItem.name,
	description: dbItem.description,
	unitPrice: dbItem.unitPrice,
	isActive: dbItem.isActive,
	createdAt: dbItem.createdAt  // Already a Unix timestamp
})

// Convert multiple database items to API format
export const toApiItems = (dbItems: DbItem[]): Item[] => 
	dbItems.map(toApiItem)