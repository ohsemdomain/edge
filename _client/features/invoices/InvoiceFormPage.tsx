//_client/features/invoices/InvoiceFormPage.tsx
import { Box, Button, Group, ScrollArea, Stack, Text, Textarea } from '@mantine/core'
import { DateInput } from '@mantine/dates'
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { useNavigate, useParams } from 'react-router-dom'
import { formatDateForDisplay } from '~c/lib/formatter'
import { trpc } from '~c/trpc'
import { AddressDisplay } from './AddressDisplay'
import { ContactFormDrawer } from './ContactFormDrawer'
import { ContactSelector } from './ContactSelector'
import { InvoiceItems } from './InvoiceItems'

interface InvoiceFormPageProps {
	mode: 'create' | 'edit'
}

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

export function InvoiceFormPage({ mode }: InvoiceFormPageProps) {
	const navigate = useNavigate()
	const { id: invoiceId } = useParams()
	const utils = trpc.useUtils()

	const [formData, setFormData] = useState({
		contactId: '',
		invoiceDate: new Date(),
		notes: '',
		items: [{ description: '', quantity: 1, unitPrice: 0 }] as InvoiceItem[]
	})

	const [selectedContact, setSelectedContact] = useState<{
		id: string
		name: string
		email?: string
		billingAddress?: ContactAddress
		shippingAddress?: ContactAddress
	} | null>(null)

	const [drawerState, setDrawerState] = useState<{
		opened: boolean
		mode: 'create' | 'edit'
		contactId?: string
	}>({
		opened: false,
		mode: 'create'
	})

	// Load addresses for selected contact
	const { data: addressesData } = trpc.contacts.getAddresses.useQuery(
		{ contactId: formData.contactId },
		{ enabled: !!formData.contactId }
	)

	// Load all contacts to find selected contact details
	const { data: contactsData } = trpc.contacts.list.useQuery({
		search: '',
		page: 1,
		limit: 1000,
		isActive: true
	})

	// Load invoice data for edit mode
	const { data: invoice } = trpc.invoices.getById.useQuery(
		{ id: invoiceId! },
		{ enabled: mode === 'edit' && !!invoiceId }
	)

	useEffect(() => {
		if (mode === 'edit' && invoice) {
			setFormData({
				contactId: invoice.contact_id,
				invoiceDate: new Date(invoice.invoiceDate),
				notes: invoice.notes || '',
				items: invoice.items.map((item) => ({
					id: item.id,
					itemId: item.item_id || undefined,
					description: item.description,
					quantity: item.quantity,
					unitPrice: item.unit_price
				}))
			})
		}
	}, [mode, invoice])

	// Update selected contact when contact changes
	useEffect(() => {
		if (formData.contactId && contactsData && addressesData) {
			const contact = contactsData.contacts.find(c => c.id === formData.contactId)
			if (contact) {
				const billingAddress = addressesData.find(addr => addr.is_default_billing)
				const shippingAddress = addressesData.find(addr => addr.is_default_shipping)
				
				setSelectedContact({
					id: contact.id,
					name: contact.name,
					email: contact.email || undefined,
					billingAddress: billingAddress as ContactAddress,
					shippingAddress: shippingAddress as ContactAddress
				})
			}
		} else {
			setSelectedContact(null)
		}
	}, [formData.contactId, contactsData, addressesData])

	const createMutation = trpc.invoices.create.useMutation({
		onSuccess: (data) => {
			utils.invoices.list.invalidate()
			navigate(`/invoices?id=${data.id}`)
		}
	})

	const updateMutation = trpc.invoices.update.useMutation({
		onSuccess: () => {
			utils.invoices.list.invalidate()
			navigate(`/invoices?id=${invoiceId}`)
		}
	})

	const handleSubmit = () => {
		// Validate required fields
		if (!formData.contactId) {
			toast.error('Please select a contact')
			return
		}

		if (formData.items.length === 0 || formData.items.every((item) => !item.description)) {
			toast.error('Please add at least one line item')
			return
		}

		// Filter out empty items
		const validItems = formData.items.filter((item) => item.description.trim())

		if (validItems.length === 0) {
			toast.error('Please add at least one line item with a description')
			return
		}

		const submitData = {
			contactId: formData.contactId,
			invoiceDate: formData.invoiceDate.toISOString(),
			notes: formData.notes || undefined,
			items: validItems.map((item) => ({
				id: item.id,
				itemId: item.itemId,
				description: item.description,
				quantity: item.quantity,
				unitPrice: item.unitPrice
			}))
		}

		if (mode === 'create') {
			toast.promise(createMutation.mutateAsync(submitData), {
				loading: 'Creating invoice...',
				success: 'Invoice created successfully',
				error: 'Failed to create invoice'
			})
		} else if (invoiceId) {
			toast.promise(updateMutation.mutateAsync({ id: invoiceId, ...submitData }), {
				loading: 'Updating invoice...',
				success: 'Invoice updated successfully',
				error: 'Failed to update invoice'
			})
		}
	}

	// Drawer handlers
	const handleAddContact = () => {
		// Clear any previous state before opening
		setDrawerState({
			opened: true,
			mode: 'create',
			contactId: undefined // Explicitly clear contactId
		})
	}

	const handleEditContact = (contactId: string) => {
		// Ensure we have a clean state transition
		setDrawerState({
			opened: true,
			mode: 'edit',
			contactId
		})
	}

	const handleContactSuccess = (contactId: string) => {
		// Update the form data and invalidate queries to refresh addresses
		setFormData({ ...formData, contactId })
		utils.contacts.list.invalidate()
		utils.contacts.getAddresses.invalidate()
		
		// Close drawer with clean state
		setDrawerState({
			opened: false,
			mode: 'create',
			contactId: undefined
		})
	}

	const handleCloseDrawer = () => {
		// Reset to clean state when closing
		setDrawerState({
			opened: false,
			mode: 'create',
			contactId: undefined
		})
	}

	const isLoading = createMutation.isPending || updateMutation.isPending
	const canSubmit =
		formData.contactId && formData.items.some((item) => item.description.trim()) && !isLoading

	return (
		<>
		<ScrollArea h='100%' type='never'>
			<Box maw={1000} w='100%' p='md' mx='auto'>
				<Stack mt='xl'>
					<Group justify='space-between' align='center' mb='xl'>
						<div>
							<Text size='xl' fw={600}>
								{mode === 'create' ? 'Create Invoice' : 'Edit Invoice'}
							</Text>
							<Text size='sm' c='dimmed'>
								{mode === 'create' ? 'Create a new invoice' : 'Update invoice details'}
							</Text>
						</div>
					</Group>

					<Stack gap='lg'>
						{/* Contact Selection */}
						<ContactSelector
							value={formData.contactId}
							onChange={(contactId) => setFormData({ ...formData, contactId })}
							onAddContact={handleAddContact}
							required
							forceClose={drawerState.opened}
						/>
						
						{/* Address Display */}
						{selectedContact && (
							<AddressDisplay
								contact={selectedContact}
								onEditContact={handleEditContact}
							/>
						)}

						{/* Invoice Date */}
						<DateInput
							label='Invoice Date'
							value={formData.invoiceDate}
							onChange={(date) => setFormData({ ...formData, invoiceDate: date || new Date() })}
							valueFormat="DD.MM.YYYY"
							dateParser={(input) => {
								// Parse custom format DD.MM.YYYY
								const [day, month, year] = input.split('.')
								if (day && month && year) {
									return new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
								}
								return new Date(input)
							}}
							required
							size='md'
							style={{ maxWidth: 300 }}
						/>

						{/* Line Items */}
						<InvoiceItems
							items={formData.items}
							onChange={(items) => setFormData({ ...formData, items })}
						/>

						{/* Notes */}
						<Textarea
							label='Notes (Optional)'
							placeholder='Additional notes for this invoice'
							value={formData.notes}
							onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
							rows={3}
							size='md'
						/>

						{/* Actions */}
						<Group mt='xl'>
							<Button onClick={handleSubmit} disabled={!canSubmit} loading={isLoading}>
								{mode === 'create' ? 'Create' : 'Save'}
							</Button>
							<Button
								variant='subtle'
								onClick={() => navigate('/invoices')}
								disabled={isLoading}
							>
								Cancel
							</Button>
						</Group>
					</Stack>
				</Stack>
			</Box>
		</ScrollArea>

		{/* Contact Form Drawer */}
		<ContactFormDrawer
			opened={drawerState.opened}
			onClose={handleCloseDrawer}
			onSuccess={handleContactSuccess}
			mode={drawerState.mode}
			contactId={drawerState.contactId}
		/>
	</>
	)
}
