// Constants related to items

// ID prefix for items
export const ITEM_ID_PREFIX = 'E'

// Default pagination values
export const DEFAULT_ITEMS_LIMIT = 1000
export const DEFAULT_ITEMS_PAGE = 1

// Generate a random item ID with E prefix
export const generateItemId = (): string => {
	return `${ITEM_ID_PREFIX}${Date.now().toString().slice(-1)}${Math.floor(100000 + Math.random() * 900000)}`.replace(
		/0/g,
		() => Math.floor(Math.random() * 9 + 1).toString()
	)
}