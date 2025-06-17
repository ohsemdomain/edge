// Constants related to contacts

// ID prefixes
export const CONTACT_ID_PREFIX = 'C'
export const ADDRESS_ID_PREFIX = 'A'

// Default pagination values
export const DEFAULT_CONTACTS_LIMIT = 1000
export const DEFAULT_CONTACTS_PAGE = 1

// Generate a random contact ID with C prefix
export const generateContactId = (): string => {
	return `${CONTACT_ID_PREFIX}${Date.now().toString().slice(-1)}${Math.floor(100000 + Math.random() * 900000)}`.replace(
		/0/g,
		() => Math.floor(Math.random() * 9 + 1).toString()
	)
}

// Generate a random address ID with A prefix
export const generateAddressId = (): string => {
	return `${ADDRESS_ID_PREFIX}${Date.now().toString().slice(-1)}${Math.floor(100000 + Math.random() * 900000)}`.replace(
		/0/g,
		() => Math.floor(Math.random() * 9 + 1).toString()
	)
}