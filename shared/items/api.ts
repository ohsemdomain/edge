// THE single source of truth for Item types
// Using camelCase convention throughout the entire application

export interface Item {
	id: string
	name: string
	description: string
	unitPrice: number
	createdAt: number  // Unix timestamp in seconds
}

export interface ItemCreateInput {
	name: string
	description: string
	unitPrice: number
}

export interface ItemUpdateInput {
	id: string
	name: string
	description: string
	unitPrice: number
}

export interface ItemListResponse {
	items: Item[]
	totalItems: number
}

export interface ItemListParams {
	search?: string
	page?: number
	limit?: number
}