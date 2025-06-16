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

interface ContactFormPageProps {
	mode: 'create' | 'edit'
	onSuccess?: (contactId: string) => void // For future invoice modal
}

export function ContactFormPage({ mode, onSuccess }: ContactFormPageProps) {
	const navigate = useNavigate()
	const { id: contactId } = useParams()
	const utils = trpc.useUtils()

	// Get state and actions from shared contact store
	const {
		formData,
		formAddresses: addresses,
		formLoading,
		formMode,
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

	// Load addresses for edit mode
	const { data: addressesData } = trpc.contacts.getAddresses.useQuery(
		{ contactId: contactId || '' },
		{ enabled: mode === 'edit' && !!contactId }
	)

	// Mutations
	const createMutation = trpc.contacts.create.useMutation({
		onSuccess: async (data) => {
			setFormLoading(true)
			
			// Save valid addresses
			const validAddresses = addresses.filter(
				(addr) => addr.receiver && addr.address_line1 && addr.postcode && addr.city && addr.state && addr.country
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
				(addr) => addr.receiver && addr.address_line1 && addr.postcode && addr.city && addr.state && addr.country
			)

			for (const addr of validAddresses) {
				if (addr.id) {
					await updateAddressMutation.mutateAsync({
						id: addr.id,
						contactId,
						receiver: addr.receiver,
						address_line1: addr.address_line1,
						address_line2: addr.address_line2,
						address_line3: addr.address_line3,
						address_line4: addr.address_line4,
						postcode: addr.postcode,
						city: addr.city,
						state: addr.state,
						country: addr.country,
						is_default_billing: addr.is_default_billing,
						is_default_shipping: addr.is_default_shipping
					})
				} else {
					await addAddressMutation.mutateAsync({ ...addr, contactId })
				}
			}

			utils.contacts.list.invalidate()
			utils.contacts.getAddresses.invalidate()
			setFormLoading(false)
			navigate(`/contacts?id=${contactId}`)
		}
	})

	const addAddressMutation = trpc.contacts.addAddress.useMutation()
	const updateAddressMutation = trpc.contacts.updateAddress.useMutation()
	const deleteAddressMutation = trpc.contacts.deleteAddress.useMutation()

	// Initialize form when component mounts
	useEffect(() => {
		setFormMode(mode)
		if (mode === 'create') {
			resetForm()
		} else if (mode === 'edit' && contactId) {
			const contact = contacts.find(c => c.id === contactId)
			if (contact && addressesData) {
				loadContactForEdit(contact, addressesData)
			}
		}
	}, [mode, contactId, contacts, addressesData, resetForm, loadContactForEdit, setFormMode])

	const handleSubmit = async () => {
		if (mode === 'create') {
			toast.promise(createMutation.mutateAsync(formData), {
				loading: 'Creating contact...',
				success: 'Contact created successfully',
				error: 'Failed to create contact'
			})
		} else if (contactId) {
			toast.promise(updateMutation.mutateAsync({ id: contactId, ...formData }), {
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
			utils.contacts.getAddresses.invalidate()
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
	const canSubmit = formData.company_name && formData.person_incharge && formData.primary_phone && !isLoading

	return (
		<ScrollArea h='100%' type='never'>
			<Box maw={800} w='100%' p='md' mx='auto'>
				<Stack mt='xl'>
					<Stack gap='md'>
						<TextInput
							label='Company Name'
							placeholder='Enter company name'
							value={formData.company_name}
							onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
							required
						/>

						<TextInput
							label='Person In Charge'
							placeholder='Enter person in charge'
							value={formData.person_incharge}
							onChange={(e) => setFormData({ ...formData, person_incharge: e.target.value })}
							required
						/>

						<TextInput
							label='Primary Phone'
							placeholder='Enter primary phone'
							value={formData.primary_phone}
							onChange={(e) => setFormData({ ...formData, primary_phone: e.target.value })}
							required
						/>

						<TextInput
							label='Email'
							placeholder='Enter email (optional)'
							type='email'
							value={formData.email}
							onChange={(e) => setFormData({ ...formData, email: e.target.value })}
						/>

						<TextInput
							label='Alternative Phone 1'
							placeholder='Enter alternative phone 1 (optional)'
							value={formData.phone_alt_1}
							onChange={(e) => setFormData({ ...formData, phone_alt_1: e.target.value })}
						/>

						<TextInput
							label='Alternative Phone 2'
							placeholder='Enter alternative phone 2 (optional)'
							value={formData.phone_alt_2}
							onChange={(e) => setFormData({ ...formData, phone_alt_2: e.target.value })}
						/>

						<TextInput
							label='Alternative Phone 3'
							placeholder='Enter alternative phone 3 (optional)'
							value={formData.phone_alt_3}
							onChange={(e) => setFormData({ ...formData, phone_alt_3: e.target.value })}
						/>

						<Switch
							label='Is Supplier'
							description='Toggle on for Supplier, off for Client'
							checked={formData.is_supplier}
							onChange={(e) => setFormData({ ...formData, is_supplier: e.currentTarget.checked })}
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
										value={address.address_line1}
										onChange={(e) => updateAddress(index, 'address_line1', e.target.value)}
										required
									/>

									<TextInput
										label='Address Line 2'
										placeholder='Enter address line 2 (optional)'
										value={address.address_line2}
										onChange={(e) => updateAddress(index, 'address_line2', e.target.value)}
									/>

									<TextInput
										label='Address Line 3'
										placeholder='Enter address line 3 (optional)'
										value={address.address_line3}
										onChange={(e) => updateAddress(index, 'address_line3', e.target.value)}
									/>

									<TextInput
										label='Address Line 4'
										placeholder='Enter address line 4 (optional)'
										value={address.address_line4}
										onChange={(e) => updateAddress(index, 'address_line4', e.target.value)}
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
											checked={address.is_default_billing}
											onChange={(e) =>
												updateAddress(index, 'is_default_billing', e.currentTarget.checked)
											}
										/>

										<Checkbox
											label='Default Shipping'
											checked={address.is_default_shipping}
											onChange={(e) =>
												updateAddress(index, 'is_default_shipping', e.currentTarget.checked)
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
