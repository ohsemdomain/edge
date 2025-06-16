//_client/features/invoices/InvoiceFormPage.tsx
import { Box, Button, Group, ScrollArea, Stack, Text, Textarea } from '@mantine/core'
import { DateInput } from '@mantine/dates'
import { useEffect } from 'react'
import toast from 'react-hot-toast'
import { useNavigate, useParams } from 'react-router-dom'
import { formatDateForDisplay } from '~c/lib/formatter'
import { trpc } from '~c/trpc'
import { AddressDisplay } from './AddressDisplay'
import { ContactFormDrawer } from './ContactFormDrawer'
import { ContactSelector } from './ContactSelector'
import { InvoiceItems } from './InvoiceItems'
import { useInvoiceStore } from '../../stores/useInvoiceStore'

interface InvoiceFormPageProps {
	mode: 'create' | 'edit'
}

export function InvoiceFormPage({ mode }: InvoiceFormPageProps) {
	const navigate = useNavigate()
	const { id: invoiceId } = useParams()
	const utils = trpc.useUtils()

	// Get all state and actions from Zustand store
	const {
		contactId,
		invoiceDate,
		notes,
		items,
		selectedContact,
		isContactSelectorOpen,
		contactDrawer,
		setContactId,
		setInvoiceDate,
		setNotes,
		setItems,
		setSelectedContact,
		setContactSelectorOpen,
		openContactDrawer,
		closeContactDrawer,
		resetForm,
		loadInvoice
	} = useInvoiceStore()

	// Load addresses for selected contact
	const { data: addressesData } = trpc.contacts.getAddresses.useQuery(
		{ contactId: contactId },
		{ enabled: !!contactId }
	)

	// Get contacts from the store (loaded by ContactSelector)
	const { allContacts: contactsData } = useInvoiceStore()

	// Load invoice data for edit mode
	const { data: invoice } = trpc.invoices.getById.useQuery(
		{ id: invoiceId! },
		{ enabled: mode === 'edit' && !!invoiceId }
	)

	// Reset form when switching to create mode
	useEffect(() => {
		if (mode === 'create') {
			resetForm()
		}
	}, [mode, resetForm])

	// Load invoice data for edit mode
	useEffect(() => {
		if (mode === 'edit' && invoice) {
			loadInvoice(invoice)
		}
	}, [mode, invoice, loadInvoice])

	// Update selected contact when contact changes
	useEffect(() => {
		if (contactId && contactsData && contactsData.length > 0 && addressesData) {
			const contact = contactsData.find(c => c.id === contactId)
			if (contact) {
				const billingAddress = addressesData.find(addr => addr.is_default_billing)
				const shippingAddress = addressesData.find(addr => addr.is_default_shipping)
				
				setSelectedContact({
					id: contact.id,
					name: contact.name,
					email: contact.email || undefined,
					billingAddress: billingAddress as any,
					shippingAddress: shippingAddress as any
				})
			}
		} else {
			setSelectedContact(null)
		}
	}, [contactId, contactsData, addressesData, setSelectedContact])

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
		if (!contactId) {
			toast.error('Please select a contact')
			return
		}

		if (items.length === 0 || items.every((item) => !item.description)) {
			toast.error('Please add at least one line item')
			return
		}

		// Filter out empty items
		const validItems = items.filter((item) => item.description.trim())

		if (validItems.length === 0) {
			toast.error('Please add at least one line item with a description')
			return
		}

		const submitData = {
			contactId: contactId,
			invoiceDate: invoiceDate.toISOString(),
			notes: notes || undefined,
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
		openContactDrawer('create')
	}

	const handleEditContact = (contactId: string) => {
		openContactDrawer('edit', contactId)
	}

	const handleContactSuccess = (newContactId: string) => {
		// Update the form data and invalidate queries to refresh addresses
		setContactId(newContactId)
		utils.contacts.list.invalidate()
		utils.contacts.getAddresses.invalidate()
		
		// Close drawer
		closeContactDrawer()
	}

	const handleCloseDrawer = () => {
		closeContactDrawer()
	}

	const isLoading = createMutation.isPending || updateMutation.isPending
	const canSubmit =
		contactId && items.some((item) => item.description.trim()) && !isLoading

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
							value={contactId}
							onChange={setContactId}
							onAddContact={handleAddContact}
							required
							forceClose={contactDrawer.opened}
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
							value={invoiceDate}
							onChange={(date) => setInvoiceDate(date || new Date())}
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
							items={items}
							onChange={setItems}
						/>

						{/* Notes */}
						<Textarea
							label='Notes (Optional)'
							placeholder='Additional notes for this invoice'
							value={notes}
							onChange={(e) => setNotes(e.target.value)}
							rows={3}
							size='md'
						/>

						{/* Actions */}
						<Group mt='xl'>
							<Button onClick={handleSubmit} disabled={!canSubmit}>
								{mode === 'create' ? 'Create' : 'Save'}
							</Button>
							<Button
								variant='subtle'
								onClick={() => navigate('/invoices')}
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
			opened={contactDrawer.opened}
			onClose={handleCloseDrawer}
			onSuccess={handleContactSuccess}
			mode={contactDrawer.mode}
			contactId={contactDrawer.contactId}
		/>
	</>
	)
}
