import {
	Box,
	Button,
	Checkbox,
	Group,
	Paper,
	ScrollArea,
	Stack,
	Switch,
	Text,
	TextInput
} from '@mantine/core'
import { Trash } from 'lucide-react'
import { useContactStore } from '../../stores/useContactStore'
import { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { trpc } from '~c/trpc'
import toast from 'react-hot-toast'
import type { ContactCreateInput } from '~/contacts/api'

interface ContactFormPageProps {
	mode: 'create' | 'edit'
	onSuccess?: (contactId: string) => void // For future invoice modal
}

// Helper to transform form data to API format
const transformFormDataToApi = (formData: any): ContactCreateInput => ({
	companyName: formData.companyName,
	personIncharge: formData.personIncharge,
	primaryPhone: formData.primaryPhone,
	email: formData.email || undefined,
	phoneAlt1: formData.phoneAlt1 || undefined,
	phoneAlt2: formData.phoneAlt2 || undefined,
	phoneAlt3: formData.phoneAlt3 || undefined,
	isSupplier: formData.isSupplier
})

export function ContactFormPage({ mode, onSuccess }: ContactFormPageProps) {
	const navigate = useNavigate()
	const { id: contactId } = useParams()
	const utils = trpc.useUtils()

	// Get state and actions from shared contact store
	const {
		formData,
		formAddresses: addresses,
		formLoading,
		contacts,
		setFormData,
		updateFormAddress: updateAddress,
		addFormAddress: addEmptyAddress,
		removeFormAddress: removeAddress,
		resetForm,
		loadContactForEdit,
		setFormLoading,
		setFormMode
	} = useContactStore()

	// Load contact data for edit mode
	const { data: contactData } = trpc.contacts.list.useQuery(
		{ page: 1, limit: 1000, isActive: true },
		{ enabled: mode === 'edit' && !!contactId }
	)

	// Load addresses for edit mode
	const { data: addressesData } = trpc.contacts.listAddresses.useQuery(
		contactId || '',
		{ enabled: mode === 'edit' && !!contactId }
	)

	// Mutations
	const createMutation = trpc.contacts.create.useMutation({
		onSuccess: async (data) => {
			setFormLoading(true)
			
			// Save valid addresses
			const validAddresses = addresses.filter(
				(addr) => addr.receiver && addr.addressLine1 && addr.postcode && addr.city && addr.state && addr.country
			)

			for (const addr of validAddresses) {
				await addAddressMutation.mutateAsync({ ...addr, contactId: data.id })
			}

			utils.contacts.list.invalidate()
			setFormLoading(false)
			
			if (onSuccess) {
				onSuccess(data.id)
			} else {
				navigate(`/contacts?id=${data.id}`)
			}
		}
	})

	const updateMutation = trpc.contacts.update.useMutation({
		onSuccess: async () => {
			if (!contactId) return
			setFormLoading(true)

			// Save valid addresses  
			const validAddresses = addresses.filter(
				(addr) => addr.receiver && addr.addressLine1 && addr.postcode && addr.city && addr.state && addr.country
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
			setFormLoading(false)
			navigate(`/contacts?id=${contactId}`)
		}
	})

	const addAddressMutation = trpc.contacts.createAddress.useMutation()
	const updateAddressMutation = trpc.contacts.updateAddress.useMutation()
	const deleteAddressMutation = trpc.contacts.deleteAddress.useMutation()

	// Initialize form when component mounts
	useEffect(() => {
		setFormMode(mode)
		if (mode === 'create') {
			resetForm()
		} else if (mode === 'edit' && contactId && contactData && addressesData) {
			const contact = contactData.contacts.find(c => c.id === contactId)
			if (contact) {
				loadContactForEdit(contact, addressesData)
			}
		}
	}, [mode, contactId, contactData, addressesData, resetForm, loadContactForEdit, setFormMode])

	const handleSubmit = async () => {
		if (mode === 'create') {
			const apiData = transformFormDataToApi(formData)
			toast.promise(createMutation.mutateAsync(apiData), {
				loading: 'Creating contact...',
				success: 'Contact created successfully',
				error: 'Failed to create contact'
			})
		} else if (contactId) {
			const apiData = transformFormDataToApi(formData)
			toast.promise(updateMutation.mutateAsync({ id: contactId, ...apiData }), {
				loading: 'Updating contact...',
				success: 'Contact updated successfully',
				error: 'Failed to update contact'
			})
		}
	}

	const handleRemoveAddress = async (index: number) => {
		const addr = addresses[index]
		if (addr.id) {
			await deleteAddressMutation.mutateAsync(addr.id)
			utils.contacts.listAddresses.invalidate()
		}
		removeAddress(index)
	}

	const handleCancel = () => {
		if (onSuccess) {
			// Close modal/drawer if in invoice context
			window.dispatchEvent(new Event('closeContactModal'))
		} else {
			navigate('/contacts')
		}
	}

	const isLoading = createMutation.isPending || updateMutation.isPending || formLoading
	
	// Validate that we have complete addresses with required defaults
	const hasValidAddresses = () => {
		// Check if we have at least one complete address
		const completeAddresses = addresses.filter(addr => 
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
	
	const canSubmit = formData.companyName && 
		formData.personIncharge && 
		formData.primaryPhone && 
		hasValidAddresses() && 
		!isLoading

	return (
		<ScrollArea h='100%' type='never'>
			<Box maw={800} w='100%' p='md' mx='auto'>
				<Stack mt='xl'>
					<Stack gap='md'>
						<TextInput
							label='Company Name'
							placeholder='Enter company name'
							value={formData.companyName}
							onChange={(e) => setFormData({ companyName: e.target.value })}
							required
						/>

						<TextInput
							label='Person In Charge'
							placeholder='Enter person in charge'
							value={formData.personIncharge}
							onChange={(e) => setFormData({ personIncharge: e.target.value })}
							required
						/>

						<TextInput
							label='Primary Phone'
							placeholder='Enter primary phone'
							value={formData.primaryPhone}
							onChange={(e) => setFormData({ primaryPhone: e.target.value })}
							required
						/>

						<TextInput
							label='Email'
							placeholder='Enter email (optional)'
							type='email'
							value={formData.email}
							onChange={(e) => setFormData({ email: e.target.value })}
						/>

						<TextInput
							label='Alternative Phone 1'
							placeholder='Enter alternative phone 1 (optional)'
							value={formData.phoneAlt1}
							onChange={(e) => setFormData({ phoneAlt1: e.target.value })}
						/>

						<TextInput
							label='Alternative Phone 2'
							placeholder='Enter alternative phone 2 (optional)'
							value={formData.phoneAlt2}
							onChange={(e) => setFormData({ phoneAlt2: e.target.value })}
						/>

						<TextInput
							label='Alternative Phone 3'
							placeholder='Enter alternative phone 3 (optional)'
							value={formData.phoneAlt3}
							onChange={(e) => setFormData({ phoneAlt3: e.target.value })}
						/>

						<Switch
							label='Is Supplier'
							description='Toggle on for Supplier, off for Client'
							checked={formData.isSupplier}
							onChange={(e) => setFormData({ isSupplier: e.currentTarget.checked })}
						/>
					</Stack>

					{/* Addresses */}
					<Stack mt='xl'>
						{addresses.map((address, index) => (
							<Paper key={index} p='md' withBorder>
								<Group justify='space-between' mb='md'>
									<Text fw={500}>Address {index + 1}</Text>
									{addresses.length > 1 && (
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
										onChange={(e) => updateAddress(index, 'receiver', e.target.value)}
										required
									/>

									<TextInput
										label='Address Line 1'
										placeholder='Enter address line 1'
										value={address.addressLine1}
										onChange={(e) => updateAddress(index, 'addressLine1', e.target.value)}
										required
									/>

									<TextInput
										label='Address Line 2'
										placeholder='Enter address line 2 (optional)'
										value={address.addressLine2}
										onChange={(e) => updateAddress(index, 'addressLine2', e.target.value)}
									/>

									<TextInput
										label='Address Line 3'
										placeholder='Enter address line 3 (optional)'
										value={address.addressLine3}
										onChange={(e) => updateAddress(index, 'addressLine3', e.target.value)}
									/>

									<TextInput
										label='Address Line 4'
										placeholder='Enter address line 4 (optional)'
										value={address.addressLine4}
										onChange={(e) => updateAddress(index, 'addressLine4', e.target.value)}
									/>

									<Group grow>
										<TextInput
											label='Postcode'
											placeholder='Enter postcode'
											value={address.postcode}
											onChange={(e) => updateAddress(index, 'postcode', e.target.value)}
											required
										/>

										<TextInput
											label='City'
											placeholder='Enter city'
											value={address.city}
											onChange={(e) => updateAddress(index, 'city', e.target.value)}
											required
										/>
									</Group>

									<Group grow>
										<TextInput
											label='State'
											placeholder='Enter state'
											value={address.state}
											onChange={(e) => updateAddress(index, 'state', e.target.value)}
											required
										/>

										<TextInput
											label='Country'
											placeholder='Enter country'
											value={address.country}
											onChange={(e) => updateAddress(index, 'country', e.target.value)}
											required
										/>
									</Group>

									<Group>
										<Checkbox
											label='Default Billing'
											checked={address.isDefaultBilling}
											onChange={(e) =>
												updateAddress(index, 'isDefaultBilling', e.currentTarget.checked)
											}
										/>

										<Checkbox
											label='Default Shipping'
											checked={address.isDefaultShipping}
											onChange={(e) =>
												updateAddress(index, 'isDefaultShipping', e.currentTarget.checked)
											}
										/>
									</Group>
								</Stack>
							</Paper>
						))}

						<Button variant='light' onClick={addEmptyAddress}>
							+ Address
						</Button>
					</Stack>

					<Group mt='xl'>
						<Button onClick={handleSubmit} disabled={!canSubmit}>
							{mode === 'create' ? 'Create' : 'Save'}
						</Button>
						<Button variant='subtle' onClick={handleCancel} disabled={isLoading}>
							Cancel
						</Button>
					</Group>
				</Stack>
			</Box>
		</ScrollArea>
	)
}
