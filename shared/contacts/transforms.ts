// Transform utilities for converting between database and API formats
import type { Contact, ContactAddress } from './api'
import type { DbContact, DbContactAddress } from './database'

// Convert database contact to API contact format
export const toApiContact = (dbContact: DbContact): Contact => ({
	id: dbContact.id,
	companyName: dbContact.companyName,
	personIncharge: dbContact.personIncharge,
	primaryPhone: dbContact.primaryPhone,
	email: dbContact.email,
	phoneAlt1: dbContact.phoneAlt1,
	phoneAlt2: dbContact.phoneAlt2,
	phoneAlt3: dbContact.phoneAlt3,
	isSupplier: Boolean(dbContact.isSupplier),
	isActive: Boolean(dbContact.isActive),
	createdAt: dbContact.createdAt  // Already a Unix timestamp
})

// Convert multiple database contacts to API format
export const toApiContacts = (dbContacts: DbContact[]): Contact[] => 
	dbContacts.map(toApiContact)

// Convert database contact address to API contact address format
export const toApiContactAddress = (dbAddress: DbContactAddress): ContactAddress => ({
	id: dbAddress.id,
	contactId: dbAddress.contactId,
	receiver: dbAddress.receiver,
	addressLine1: dbAddress.addressLine1,
	addressLine2: dbAddress.addressLine2,
	addressLine3: dbAddress.addressLine3,
	addressLine4: dbAddress.addressLine4,
	postcode: dbAddress.postcode,
	city: dbAddress.city,
	state: dbAddress.state,
	country: dbAddress.country,
	isDefaultBilling: Boolean(dbAddress.isDefaultBilling),
	isDefaultShipping: Boolean(dbAddress.isDefaultShipping),
	createdAt: dbAddress.createdAt  // Already a Unix timestamp
})

// Convert multiple database contact addresses to API format
export const toApiContactAddresses = (dbAddresses: DbContactAddress[]): ContactAddress[] => 
	dbAddresses.map(toApiContactAddress)