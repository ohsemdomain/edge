// _client/stores/useContactStore.ts
import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

// Shared interfaces (can be imported by both features)
export interface Contact {
	id: string
	name: string
	company_name: string
	person_incharge: string
	primary_phone: string
	email: string | null
	phone_alt_1: string | null
	phone_alt_2: string | null
	phone_alt_3: string | null
	is_supplier: boolean
	is_active: boolean
	createdAt: string | Date
}

export interface ContactFormData {
	company_name: string
	person_incharge: string
	primary_phone: string
	email: string
	phone_alt_1: string
	phone_alt_2: string
	phone_alt_3: string
	is_supplier: boolean
}

export interface AddressForm {
	id?: string
	receiver: string
	address_line1: string
	address_line2: string
	address_line3: string
	address_line4: string
	postcode: string
	city: string
	state: string
	country: string
	is_default_billing: boolean
	is_default_shipping: boolean
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
	company_name: '',
	person_incharge: '',
	primary_phone: '',
	email: '',
	phone_alt_1: '',
	phone_alt_2: '',
	phone_alt_3: '',
	is_supplier: false
}

const emptyAddress: AddressForm = {
	receiver: '',
	address_line1: '',
	address_line2: '',
	address_line3: '',
	address_line4: '',
	postcode: '',
	city: '',
	state: '',
	country: '',
	is_default_billing: false,
	is_default_shipping: false
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
				if (field === 'is_default_billing' && value) {
					updated.forEach((addr, i) => {
						if (i !== index) addr.is_default_billing = false
					})
				}
				if (field === 'is_default_shipping' && value) {
					updated.forEach((addr, i) => {
						if (i !== index) addr.is_default_shipping = false
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
					company_name: contact.company_name,
					person_incharge: contact.person_incharge,
					primary_phone: contact.primary_phone,
					email: contact.email || '',
					phone_alt_1: contact.phone_alt_1 || '',
					phone_alt_2: contact.phone_alt_2 || '',
					phone_alt_3: contact.phone_alt_3 || '',
					is_supplier: contact.is_supplier
				},
				formAddresses: addresses.length > 0 
					? addresses.map((addr: any) => ({
						id: addr.id,
						receiver: addr.receiver,
						address_line1: addr.address_line1,
						address_line2: addr.address_line2 || '',
						address_line3: addr.address_line3 || '',
						address_line4: addr.address_line4 || '',
						postcode: addr.postcode,
						city: addr.city,
						state: addr.state,
						country: addr.country,
						is_default_billing: Boolean(addr.is_default_billing),
						is_default_shipping: Boolean(addr.is_default_shipping)
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
					contact.company_name?.toLowerCase().includes(search) ||
					contact.person_incharge?.toLowerCase().includes(search) ||
					contact.primary_phone?.includes(search) ||
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