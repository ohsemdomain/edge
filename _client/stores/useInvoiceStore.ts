// _client/features/invoices/useInvoiceStore.ts
import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

interface InvoiceItem {
	id?: string
	itemId?: string
	description: string
	quantity: number
	unitPrice: number
}

interface ContactAddress {
	id: string
	receiver: string
	address_line1: string
	address_line2?: string
	address_line3?: string
	address_line4?: string
	postcode: string
	city: string
	state: string
	country: string
	is_default_billing: boolean
	is_default_shipping: boolean
}

interface SelectedContact {
	id: string
	name: string
	email?: string
	billingAddress?: ContactAddress
	shippingAddress?: ContactAddress
}

// Import shared interfaces from contact store
import type { Contact, ContactFormData, AddressForm } from './useContactStore'

interface InvoiceFormState {
	// Form data
	contactId: string
	invoiceDate: Date
	notes: string
	items: InvoiceItem[]
	
	// UI state
	selectedContact: SelectedContact | null
	isContactSelectorOpen: boolean
	
	// Contact selector state
	contactSelectorSearch: string
	contactSelectorDropdownOpen: boolean
	allContacts: Contact[]
	
	
	// Drawer state
	contactDrawer: {
		opened: boolean
		mode: 'create' | 'edit'
		contactId?: string
	}
	
	// Actions
	setContactId: (contactId: string) => void
	setInvoiceDate: (date: Date) => void
	setNotes: (notes: string) => void
	setItems: (items: InvoiceItem[]) => void
	updateItem: (index: number, field: keyof InvoiceItem, value: any) => void
	addItem: () => void
	removeItem: (index: number) => void
	
	// Contact actions
	setSelectedContact: (contact: SelectedContact | null) => void
	setContactSelectorOpen: (open: boolean) => void
	
	// Contact selector actions
	setContactSelectorSearch: (search: string) => void
	setContactSelectorDropdownOpen: (open: boolean) => void
	setAllContacts: (contacts: Contact[]) => void
	toggleContactSelectorDropdown: () => void
	selectContact: (contactId: string) => void
	
	
	// Drawer actions
	openContactDrawer: (mode: 'create' | 'edit', contactId?: string) => void
	closeContactDrawer: () => void
	
	// Reset actions
	resetForm: () => void
	loadInvoice: (invoice: any) => void
}


const initialState = {
	contactId: '',
	invoiceDate: new Date(),
	notes: '',
	items: [{ description: '', quantity: 1, unitPrice: 0 }] as InvoiceItem[],
	selectedContact: null,
	isContactSelectorOpen: false,
	contactSelectorSearch: '',
	contactSelectorDropdownOpen: false,
	allContacts: [] as Contact[],
	contactDrawer: {
		opened: false,
		mode: 'create' as const,
		contactId: undefined
	}
}

export const useInvoiceStore = create<InvoiceFormState>()(
	devtools(
		(set) => ({
			...initialState,
			
			// Basic setters
			setContactId: (contactId) => set({ contactId }),
			setInvoiceDate: (invoiceDate) => set({ invoiceDate }),
			setNotes: (notes) => set({ notes }),
			setItems: (items) => set({ items }),
			
			// Item management
			updateItem: (index, field, value) => set((state) => {
				const updated = [...state.items]
				updated[index] = { ...updated[index], [field]: value }
				return { items: updated }
			}),
			
			addItem: () => set((state) => ({
				items: [...state.items, { description: '', quantity: 1, unitPrice: 0 }]
			})),
			
			removeItem: (index) => set((state) => ({
				items: state.items.filter((_, i) => i !== index)
			})),
			
			// Contact management
			setSelectedContact: (selectedContact) => set({ selectedContact }),
			setContactSelectorOpen: (isContactSelectorOpen) => set({ isContactSelectorOpen }),
			
			// Contact selector actions
			setContactSelectorSearch: (contactSelectorSearch) => set({ contactSelectorSearch }),
			setContactSelectorDropdownOpen: (contactSelectorDropdownOpen) => set({ contactSelectorDropdownOpen }),
			setAllContacts: (allContacts) => set({ allContacts }),
			toggleContactSelectorDropdown: () => set((state) => ({ 
				contactSelectorDropdownOpen: !state.contactSelectorDropdownOpen,
				contactSelectorSearch: !state.contactSelectorDropdownOpen ? '' : state.contactSelectorSearch
			})),
			selectContact: (contactId) => set((state) => ({
				contactId,
				contactSelectorDropdownOpen: false,
				contactSelectorSearch: ''
			})),
			
			
			// Drawer management
			openContactDrawer: (mode, contactId) => set({
				contactDrawer: { opened: true, mode, contactId }
			}),
			
			closeContactDrawer: () => set({
				contactDrawer: { opened: false, mode: 'create', contactId: undefined }
			}),
			
			// Reset form
			resetForm: () => set(initialState),
			
			// Load existing invoice
			loadInvoice: (invoice) => set({
				contactId: invoice.contact_id,
				invoiceDate: new Date(invoice.invoiceDate),
				notes: invoice.notes || '',
				items: invoice.items.map((item: any) => ({
					id: item.id,
					itemId: item.item_id || undefined,
					description: item.description,
					quantity: item.quantity,
					unitPrice: item.unit_price
				}))
			})
		}),
		{
			name: 'invoice-store'
		}
	)
)