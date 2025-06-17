// THE single source of truth for Contact types
// Using camelCase convention throughout the entire application

export interface Contact {
	id: string
	companyName: string
	personIncharge: string
	primaryPhone: string
	email: string | null
	phoneAlt1: string | null
	phoneAlt2: string | null
	phoneAlt3: string | null
	isSupplier: boolean
	createdAt: number  // Unix timestamp in seconds
}

export interface ContactAddress {
	id: string
	contactId: string
	receiver: string
	addressLine1: string
	addressLine2: string | null
	addressLine3: string | null
	addressLine4: string | null
	postcode: string
	city: string
	state: string
	country: string
	isDefaultBilling: boolean
	isDefaultShipping: boolean
	createdAt: number  // Unix timestamp in seconds
}

export interface ContactCreateInput {
	companyName: string
	personIncharge: string
	primaryPhone: string
	email?: string
	phoneAlt1?: string
	phoneAlt2?: string
	phoneAlt3?: string
	isSupplier?: boolean
}

export interface ContactUpdateInput {
	id: string
	companyName: string
	personIncharge: string
	primaryPhone: string
	email?: string
	phoneAlt1?: string
	phoneAlt2?: string
	phoneAlt3?: string
	isSupplier?: boolean
}

export interface ContactAddressCreateInput {
	contactId: string
	receiver: string
	addressLine1: string
	addressLine2?: string
	addressLine3?: string
	addressLine4?: string
	postcode: string
	city: string
	state: string
	country: string
	isDefaultBilling?: boolean
	isDefaultShipping?: boolean
}

export interface ContactAddressUpdateInput {
	id: string
	receiver: string
	addressLine1: string
	addressLine2?: string
	addressLine3?: string
	addressLine4?: string
	postcode: string
	city: string
	state: string
	country: string
	isDefaultBilling?: boolean
	isDefaultShipping?: boolean
}

export interface ContactListResponse {
	contacts: Contact[]
	totalItems: number
}

export interface ContactListParams {
	search?: string
	page?: number
	limit?: number
}