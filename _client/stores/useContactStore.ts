// _client/stores/useContactStore.ts
import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import type { Contact, ContactAddress } from '~/contacts/api'

// Re-export shared types for convenience
export type { Contact, ContactAddress }

// Form data types based on shared API types
export interface ContactFormData {
	companyName: string
	personIncharge: string
	primaryPhone: string
	email: string
	phoneAlt1: string
	phoneAlt2: string
	phoneAlt3: string
	isSupplier: boolean
}

export interface AddressForm {
	id?: string
	receiver: string
	addressLine1: string
	addressLine2: string
	addressLine3: string
	addressLine4: string
	postcode: string
	city: string
	state: string
	country: string
	isDefaultBilling: boolean
	isDefaultShipping: boolean
}

interface ContactStore {
	// Data cache
	contacts: Contact[]
	selectedContactId: string
	searchTerm: string
	isLoading: boolean
	
	// Form state
	formData: ContactFormData
	formAddresses: AddressForm[]
	formLoading: boolean
	formMode: 'create' | 'edit'
	
	// Data actions
	setContacts: (contacts: Contact[]) => void
	setSelectedContactId: (id: string) => void
	setSearchTerm: (term: string) => void
	setLoading: (loading: boolean) => void
	
	// Form actions
	setFormData: (data: Partial<ContactFormData>) => void
	setFormAddresses: (addresses: AddressForm[]) => void
	updateFormAddress: (index: number, field: keyof AddressForm, value: string | boolean) => void
	addFormAddress: () => void
	removeFormAddress: (index: number) => void
	setFormLoading: (loading: boolean) => void
	setFormMode: (mode: 'create' | 'edit') => void
	
	// Utility actions
	resetForm: () => void
	loadContactForEdit: (contact: Contact, addresses: any[]) => void
	getContactById: (id: string) => Contact | undefined
	getFilteredContacts: (searchTerm: string) => Contact[]
	
	// Reset all state
	reset: () => void
}

const initialFormData: ContactFormData = {
	companyName: '',
	personIncharge: '',
	primaryPhone: '',
	email: '',
	phoneAlt1: '',
	phoneAlt2: '',
	phoneAlt3: '',
	isSupplier: false
}

const emptyAddress: AddressForm = {
	receiver: '',
	addressLine1: '',
	addressLine2: '',
	addressLine3: '',
	addressLine4: '',
	postcode: '',
	city: '',
	state: '',
	country: '',
	isDefaultBilling: false,
	isDefaultShipping: false
}

const initialState = {
	contacts: [] as Contact[],
	selectedContactId: '',
	searchTerm: '',
	isLoading: false,
	formData: initialFormData,
	formAddresses: [{ ...emptyAddress }] as AddressForm[],
	formLoading: false,
	formMode: 'create' as const
}

export const useContactStore = create<ContactStore>()(
	devtools(
		(set, get) => ({
			...initialState,
			
			// Data actions
			setContacts: (contacts) => set({ contacts }),
			setSelectedContactId: (selectedContactId) => set({ selectedContactId }),
			setSearchTerm: (searchTerm) => set({ searchTerm }),
			setLoading: (isLoading) => set({ isLoading }),
			
			// Form actions
			setFormData: (data) => set((state) => ({
				formData: { ...state.formData, ...data }
			})),
			
			setFormAddresses: (formAddresses) => set({ formAddresses }),
			
			updateFormAddress: (index, field, value) => set((state) => {
				const updated = [...state.formAddresses]
				updated[index] = { ...updated[index], [field]: value }
				
				// Handle default toggles
				if (field === 'isDefaultBilling' && value) {
					updated.forEach((addr, i) => {
						if (i !== index) addr.isDefaultBilling = false
					})
				}
				if (field === 'isDefaultShipping' && value) {
					updated.forEach((addr, i) => {
						if (i !== index) addr.isDefaultShipping = false
					})
				}
				
				return { formAddresses: updated }
			}),
			
			addFormAddress: () => set((state) => ({
				formAddresses: [...state.formAddresses, { ...emptyAddress }]
			})),
			
			removeFormAddress: (index) => set((state) => {
				if (state.formAddresses.length === 1) {
					return { formAddresses: [{ ...emptyAddress }] }
				}
				return {
					formAddresses: state.formAddresses.filter((_, i) => i !== index)
				}
			}),
			
			setFormLoading: (formLoading) => set({ formLoading }),
			setFormMode: (formMode) => set({ formMode }),
			
			// Utility actions
			resetForm: () => set({
				formData: initialFormData,
				formAddresses: [{ ...emptyAddress }],
				formLoading: false,
				formMode: 'create'
			}),
			
			loadContactForEdit: (contact, addresses) => set({
				formData: {
					companyName: contact.companyName,
					personIncharge: contact.personIncharge,
					primaryPhone: contact.primaryPhone,
					email: contact.email || '',
					phoneAlt1: contact.phoneAlt1 || '',
					phoneAlt2: contact.phoneAlt2 || '',
					phoneAlt3: contact.phoneAlt3 || '',
					isSupplier: contact.isSupplier
				},
				formAddresses: addresses.length > 0 
					? addresses.map((addr: any) => ({
						id: addr.id,
						receiver: addr.receiver,
						addressLine1: addr.addressLine1,
						addressLine2: addr.addressLine2 || '',
						addressLine3: addr.addressLine3 || '',
						addressLine4: addr.addressLine4 || '',
						postcode: addr.postcode,
						city: addr.city,
						state: addr.state,
						country: addr.country,
						isDefaultBilling: Boolean(addr.isDefaultBilling),
						isDefaultShipping: Boolean(addr.isDefaultShipping)
					}))
					: [{ ...emptyAddress }],
				formMode: 'edit'
			}),
			
			getContactById: (id) => {
				return get().contacts.find(c => c.id === id)
			},
			
			getFilteredContacts: (searchTerm) => {
				const { contacts } = get()
				if (!searchTerm.trim()) return contacts
				
				const search = searchTerm.toLowerCase()
				return contacts.filter(contact =>
					contact.companyName?.toLowerCase().includes(search) ||
					contact.personIncharge?.toLowerCase().includes(search) ||
					contact.primaryPhone?.includes(search) ||
					contact.email?.toLowerCase().includes(search)
				)
			},
			
			reset: () => set(initialState)
		}),
		{
			name: 'contact-store'
		}
	)
)