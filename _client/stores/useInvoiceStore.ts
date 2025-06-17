// _client/stores/useInvoiceStore.ts
import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

// Import shared types as single source of truth
import type { InvoiceItemCreateInput } from '~/invoices/api'
import type { Contact, ContactAddress } from '~/contacts/api'
import { DEFAULT_INVOICE_ITEM } from '~/invoices/constants'

// Use shared ContactAddress type but create a local interface for selected contact
interface SelectedContact {
	id: string
	companyName: string
	email?: string
	billingAddress?: ContactAddress
	shippingAddress?: ContactAddress
}

interface InvoiceFormState {
	// Form data
	contactId: string
	invoiceDate: Date
	notes: string
	items: InvoiceItemCreateInput[]
	
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
	setItems: (items: InvoiceItemCreateInput[]) => void
	updateItem: (index: number, field: keyof InvoiceItemCreateInput, value: any) => void
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
	items: [{ ...DEFAULT_INVOICE_ITEM }] as InvoiceItemCreateInput[],
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
				items: [...state.items, { ...DEFAULT_INVOICE_ITEM }]
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
			selectContact: (contactId) => set(() => ({
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
				contactId: invoice.contactId,
				invoiceDate: new Date(invoice.invoiceDate * 1000), // Convert from Unix timestamp
				notes: invoice.notes || '',
				items: invoice.items.map((item: any) => ({
					itemId: item.itemId || undefined,
					description: item.description,
					quantity: item.quantity,
					unitPrice: item.unitPrice
				}))
			})
		}),
		{
			name: 'invoice-store'
		}
	)
)