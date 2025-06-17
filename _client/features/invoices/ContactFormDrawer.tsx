// _client/features/invoices/ContactFormDrawer.tsx
import {
	Box,
	Button,
	Checkbox,
	Drawer,
	Group,
	Paper,
	ScrollArea,
	Stack,
	Switch,
	Text,
	TextInput
} from '@mantine/core'
import { Trash } from 'lucide-react'
import { useEffect } from 'react'
import toast from 'react-hot-toast'
import { trpc } from '~c/trpc'
import { useContactStore } from '../../stores/useContactStore'

interface ContactFormDrawerProps {
	opened: boolean
	onClose: () => void
	onSuccess: (contactId: string) => void
	mode: 'create' | 'edit'
	contactId?: string
}

export function ContactFormDrawer({ opened, onClose, onSuccess, mode, contactId }: ContactFormDrawerProps) {
	const utils = trpc.useUtils()

	// Get all state and actions from shared contact store
	const {
		formData: contactFormData,
		formAddresses: contactFormAddresses,
		formLoading: contactFormLoading,
		setFormData: setContactFormData,
		updateFormAddress: updateContactFormAddress,
		addFormAddress: addContactFormAddress,
		removeFormAddress: removeContactFormAddress,
		resetForm: resetContactForm,
		loadContactForEdit,
		setFormLoading: setContactFormLoading
	} = useContactStore()

	// Load contact data for edit mode
	const { data: contactsData } = trpc.contacts.list.useQuery(
		{ isActive: true },
		{ 
			enabled: opened && mode === 'edit' && !!contactId,
			staleTime: 30000
		}
	)

	// Load addresses for edit mode
	const { data: addressesData } = trpc.contacts.listAddresses.useQuery(
		contactId || '',
		{ 
			enabled: opened && mode === 'edit' && !!contactId,
			staleTime: 30000
		}
	)

	// Mutations
	const createMutation = trpc.contacts.create.useMutation({
		onSuccess: async (data) => {
			setContactFormLoading(true)
			
			// Save valid addresses
			const validAddresses = contactFormAddresses.filter(
				(addr) =>
					addr.receiver &&
					addr.addressLine1 &&
					addr.postcode &&
					addr.city &&
					addr.state &&
					addr.country
			)

			for (const addr of validAddresses) {
				await addAddressMutation.mutateAsync({ ...addr, contactId: data.id })
			}

			utils.contacts.list.invalidate()
			utils.contacts.listAddresses.invalidate()
			setContactFormLoading(false)
			onSuccess(data.id)
		},
		onError: () => {
			setContactFormLoading(false)
		}
	})

	const updateMutation = trpc.contacts.update.useMutation({
		onSuccess: async () => {
			if (!contactId) return
			
			setContactFormLoading(true)

			// Save valid addresses
			const validAddresses = contactFormAddresses.filter(
				(addr) =>
					addr.receiver &&
					addr.addressLine1 &&
					addr.postcode &&
					addr.city &&
					addr.state &&
					addr.country
			)

			for (const addr of validAddresses) {
				if (addr.id) {
					await updateAddressMutation.mutateAsync({
						id: addr.id,
						receiver: addr.receiver,
						addressLine1: addr.addressLine1,
						addressLine2: addr.addressLine2,
						addressLine3: addr.addressLine3,
						addressLine4: addr.addressLine4,
						postcode: addr.postcode,
						city: addr.city,
						state: addr.state,
						country: addr.country,
						isDefaultBilling: addr.isDefaultBilling,
						isDefaultShipping: addr.isDefaultShipping
					})
				} else {
					await addAddressMutation.mutateAsync({ ...addr, contactId })
				}
			}

			utils.contacts.list.invalidate()
			utils.contacts.listAddresses.invalidate()
			setContactFormLoading(false)
			onSuccess(contactId)
		},
		onError: () => {
			setContactFormLoading(false)
		}
	})

	const addAddressMutation = trpc.contacts.createAddress.useMutation()
	const updateAddressMutation = trpc.contacts.updateAddress.useMutation()
	const deleteAddressMutation = trpc.contacts.deleteAddress.useMutation()

	// Initialize form when drawer opens
	useEffect(() => {
		if (opened) {
			if (mode === 'create') {
				resetContactForm()
			} else if (mode === 'edit' && contactId && contactsData && addressesData) {
				// Load contact data from the query result
				const contact = contactsData.contacts.find(c => c.id === contactId)
				if (contact) {
					console.log('Loading contact for edit:', { contact, addressesData })
					loadContactForEdit(contact, addressesData)
				}
			}
		}
	}, [opened, mode, contactId, contactsData, addressesData, resetContactForm, loadContactForEdit])

	const handleSubmit = async () => {
		if (mode === 'create') {
			toast.promise(createMutation.mutateAsync(contactFormData), {
				loading: 'Creating contact...',
				success: 'Contact created successfully',
				error: 'Failed to create contact'
			})
		} else if (contactId) {
			toast.promise(updateMutation.mutateAsync({ id: contactId, ...contactFormData }), {
				loading: 'Updating contact...',
				success: 'Contact updated successfully',
				error: 'Failed to update contact'
			})
		}
	}

	const handleRemoveAddress = async (index: number) => {
		const addr = contactFormAddresses[index]

		if (addr.id) {
			await deleteAddressMutation.mutateAsync(addr.id)
			utils.contacts.listAddresses.invalidate()
		}
		
		removeContactFormAddress(index)
	}

	const isLoading = createMutation.isPending || updateMutation.isPending || contactFormLoading
	
	// Validate that we have complete addresses with required defaults
	const hasValidAddresses = () => {
		// Check if we have at least one complete address
		const completeAddresses = contactFormAddresses.filter(addr => 
			addr.receiver && 
			addr.addressLine1 && 
			addr.postcode && 
			addr.city && 
			addr.state && 
			addr.country
		)
		
		if (completeAddresses.length === 0) return false
		
		// Check if we have at least one default billing and one default shipping
		const hasDefaultBilling = completeAddresses.some(addr => addr.isDefaultBilling)
		const hasDefaultShipping = completeAddresses.some(addr => addr.isDefaultShipping)
		
		return hasDefaultBilling && hasDefaultShipping
	}
	
	const canSubmit = contactFormData.companyName && 
		contactFormData.personIncharge && 
		contactFormData.primaryPhone && 
		hasValidAddresses() && 
		!isLoading

	return (
		<Drawer
			opened={opened}
			onClose={onClose}
			position='top'
			size='xl'
			title={mode === 'create' ? 'Add New Contact' : 'Edit Contact'}
			overlayProps={{ backgroundOpacity: 0.5, blur: 4 }}
			styles={{
				content: {
					marginLeft: 'auto',
					marginRight: 'auto',
					maxWidth: '1200px'
				}
			}}
		>
			<ScrollArea h='100%' type='never'>
				<Box p='md'>
					<Stack gap='md'>
						<TextInput
							label='Company Name'
							placeholder='Enter company name'
							value={contactFormData.companyName}
							onChange={(e) => setContactFormData({ companyName: e.target.value })}
							required
						/>

						<TextInput
							label='Person In Charge'
							placeholder='Enter person in charge'
							value={contactFormData.personIncharge}
							onChange={(e) => setContactFormData({ personIncharge: e.target.value })}
							required
						/>

						<TextInput
							label='Primary Phone'
							placeholder='Enter primary phone'
							value={contactFormData.primaryPhone}
							onChange={(e) => setContactFormData({ primaryPhone: e.target.value })}
							required
						/>

						<TextInput
							label='Email'
							placeholder='Enter email (optional)'
							type='email'
							value={contactFormData.email}
							onChange={(e) => setContactFormData({ email: e.target.value })}
						/>

						<TextInput
							label='Alternative Phone 1'
							placeholder='Enter alternative phone 1 (optional)'
							value={contactFormData.phoneAlt1}
							onChange={(e) => setContactFormData({ phoneAlt1: e.target.value })}
						/>

						<TextInput
							label='Alternative Phone 2'
							placeholder='Enter alternative phone 2 (optional)'
							value={contactFormData.phoneAlt2}
							onChange={(e) => setContactFormData({ phoneAlt2: e.target.value })}
						/>

						<TextInput
							label='Alternative Phone 3'
							placeholder='Enter alternative phone 3 (optional)'
							value={contactFormData.phoneAlt3}
							onChange={(e) => setContactFormData({ phoneAlt3: e.target.value })}
						/>

						<Switch
							label='Is Supplier'
							description='Toggle on for Supplier, off for Client'
							checked={contactFormData.isSupplier}
							onChange={(e) => setContactFormData({ isSupplier: e.currentTarget.checked })}
						/>
					</Stack>

					{/* Addresses */}
					<Stack mt='xl'>
						{contactFormAddresses.map((address, index) => (
							<Paper key={index} p='md' withBorder>
								<Group justify='space-between' mb='md'>
									<Text fw={500}>Address {index + 1}</Text>
									{contactFormAddresses.length > 1 && (
										<Button
											size='xs'
											color='red'
											variant='subtle'
											leftSection={<Trash size={14} />}
											onClick={() => handleRemoveAddress(index)}
										>
											Remove
										</Button>
									)}
								</Group>

								<Stack gap='sm'>
									<TextInput
										label='Receiver'
										placeholder='Enter receiver name'
										value={address.receiver}
										onChange={(e) => updateContactFormAddress(index, 'receiver', e.target.value)}
										required
									/>

									<TextInput
										label='Address Line 1'
										placeholder='Enter address line 1'
										value={address.addressLine1}
										onChange={(e) => updateContactFormAddress(index, 'addressLine1', e.target.value)}
										required
									/>

									<TextInput
										label='Address Line 2'
										placeholder='Enter address line 2 (optional)'
										value={address.addressLine2}
										onChange={(e) => updateContactFormAddress(index, 'addressLine2', e.target.value)}
									/>

									<TextInput
										label='Address Line 3'
										placeholder='Enter address line 3 (optional)'
										value={address.addressLine3}
										onChange={(e) => updateContactFormAddress(index, 'addressLine3', e.target.value)}
									/>

									<TextInput
										label='Address Line 4'
										placeholder='Enter address line 4 (optional)'
										value={address.addressLine4}
										onChange={(e) => updateContactFormAddress(index, 'addressLine4', e.target.value)}
									/>

									<Group grow>
										<TextInput
											label='Postcode'
											placeholder='Enter postcode'
											value={address.postcode}
											onChange={(e) => updateContactFormAddress(index, 'postcode', e.target.value)}
											required
										/>

										<TextInput
											label='City'
											placeholder='Enter city'
											value={address.city}
											onChange={(e) => updateContactFormAddress(index, 'city', e.target.value)}
											required
										/>
									</Group>

									<Group grow>
										<TextInput
											label='State'
											placeholder='Enter state'
											value={address.state}
											onChange={(e) => updateContactFormAddress(index, 'state', e.target.value)}
											required
										/>

										<TextInput
											label='Country'
											placeholder='Enter country'
											value={address.country}
											onChange={(e) => updateContactFormAddress(index, 'country', e.target.value)}
											required
										/>
									</Group>

									<Group>
										<Checkbox
											label='Default Billing'
											checked={address.isDefaultBilling}
											onChange={(e) =>
												updateContactFormAddress(index, 'isDefaultBilling', e.currentTarget.checked)
											}
										/>

										<Checkbox
											label='Default Shipping'
											checked={address.isDefaultShipping}
											onChange={(e) =>
												updateContactFormAddress(index, 'isDefaultShipping', e.currentTarget.checked)
											}
										/>
									</Group>
								</Stack>
							</Paper>
						))}

						<Button variant='light' onClick={addContactFormAddress}>
							+ Address
						</Button>
					</Stack>

					<Group mt='xl'>
						<Button onClick={handleSubmit} disabled={!canSubmit}>
							{mode === 'create' ? 'Create' : 'Save'}
						</Button>
						<Button variant='subtle' onClick={onClose} disabled={isLoading}>
							Cancel
						</Button>
					</Group>
				</Box>
			</ScrollArea>
		</Drawer>
	)
}