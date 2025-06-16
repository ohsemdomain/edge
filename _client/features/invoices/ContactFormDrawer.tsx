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
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { trpc } from '~c/trpc'

interface ContactFormDrawerProps {
	opened: boolean
	onClose: () => void
	onSuccess: (contactId: string) => void
	mode: 'create' | 'edit'
	contactId?: string
}

interface AddressForm {
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

const EMPTY_ADDRESS: AddressForm = {
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

export function ContactFormDrawer({ opened, onClose, onSuccess, mode, contactId }: ContactFormDrawerProps) {
	const utils = trpc.useUtils()

	const [formData, setFormData] = useState({
		company_name: '',
		person_incharge: '',
		primary_phone: '',
		email: '',
		phone_alt_1: '',
		phone_alt_2: '',
		phone_alt_3: '',
		is_supplier: false
	})

	const [addresses, setAddresses] = useState<AddressForm[]>([{ ...EMPTY_ADDRESS }])

	// Load contact data for edit mode - only when drawer is open and in edit mode
	const { data: contactsData } = trpc.contacts.list.useQuery(
		{ search: '', page: 1, limit: 1000, isActive: true },
		{ 
			enabled: opened && mode === 'edit' && !!contactId,
			staleTime: 30000 // Cache for 30 seconds to reduce requests
		}
	)

	// Load addresses for edit mode - only when drawer is open and in edit mode
	const { data: addressesData } = trpc.contacts.getAddresses.useQuery(
		{ contactId: contactId || '' },
		{ 
			enabled: opened && mode === 'edit' && !!contactId,
			staleTime: 30000 // Cache for 30 seconds to reduce requests
		}
	)

	// Mutations
	const createMutation = trpc.contacts.create.useMutation({
		onSuccess: async (data) => {
			// Save valid addresses
			const validAddresses = addresses.filter(
				(addr) =>
					addr.receiver &&
					addr.address_line1 &&
					addr.postcode &&
					addr.city &&
					addr.state &&
					addr.country
			)

			for (const addr of validAddresses) {
				await addAddressMutation.mutateAsync({ ...addr, contactId: data.id })
			}

			utils.contacts.list.invalidate()
			onSuccess(data.id)
		}
	})

	const updateMutation = trpc.contacts.update.useMutation({
		onSuccess: async () => {
			if (!contactId) return

			// Save valid addresses
			const validAddresses = addresses.filter(
				(addr) =>
					addr.receiver &&
					addr.address_line1 &&
					addr.postcode &&
					addr.city &&
					addr.state &&
					addr.country
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
			onSuccess(contactId)
		}
	})

	const addAddressMutation = trpc.contacts.addAddress.useMutation()
	const updateAddressMutation = trpc.contacts.updateAddress.useMutation()
	const deleteAddressMutation = trpc.contacts.deleteAddress.useMutation()

	// Initialize clean state when drawer opens
	useEffect(() => {
		if (opened) {
			if (mode === 'create') {
				// Always start with clean state for create mode
				setFormData({
					company_name: '',
					person_incharge: '',
					primary_phone: '',
					email: '',
					phone_alt_1: '',
					phone_alt_2: '',
					phone_alt_3: '',
					is_supplier: false
				})
				setAddresses([{ ...EMPTY_ADDRESS }])
			}
			// Edit mode data will be loaded by separate useEffects below
		}
	}, [opened, mode])

	// Load existing contact data for edit mode only
	useEffect(() => {
		if (opened && mode === 'edit' && contactId && contactsData) {
			const contact = contactsData.contacts.find((c) => c.id === contactId)
			if (contact) {
				setFormData({
					company_name: contact.company_name,
					person_incharge: contact.person_incharge,
					primary_phone: contact.primary_phone,
					email: contact.email || '',
					phone_alt_1: contact.phone_alt_1 || '',
					phone_alt_2: contact.phone_alt_2 || '',
					phone_alt_3: contact.phone_alt_3 || '',
					is_supplier: contact.is_supplier
				})
			}
		}
	}, [opened, mode, contactId, contactsData])

	// Load existing addresses for edit mode only
	useEffect(() => {
		if (opened && mode === 'edit' && contactId && addressesData) {
			if (addressesData.length > 0) {
				setAddresses(
					addressesData.map((addr: any) => ({
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
				)
			} else {
				setAddresses([{ ...EMPTY_ADDRESS }])
			}
		}
	}, [opened, mode, contactId, addressesData])

	const handleSubmit = async () => {
		if (mode === 'create') {
			toast.promise(createMutation.mutateAsync(formData), {
				loading: 'Saving...',
				success: 'Contact created',
				error: 'Could not save'
			})
		} else if (contactId) {
			toast.promise(updateMutation.mutateAsync({ id: contactId, ...formData }), {
				loading: 'Saving...',
				success: 'Contact updated',
				error: 'Could not save'
			})
		}
	}

	const updateAddress = (index: number, field: keyof AddressForm, value: string | boolean) => {
		const updated = [...addresses]
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

		setAddresses(updated)
	}

	const addEmptyAddress = () => {
		setAddresses([...addresses, { ...EMPTY_ADDRESS }])
	}

	const removeAddress = async (index: number) => {
		const addr = addresses[index]

		if (addresses.length === 1) {
			setAddresses([{ ...EMPTY_ADDRESS }])
			return
		}

		if (addr.id) {
			await deleteAddressMutation.mutateAsync(addr.id)
			utils.contacts.getAddresses.invalidate()
		}
		setAddresses(addresses.filter((_, i) => i !== index))
	}

	const isLoading = createMutation.isPending || updateMutation.isPending
	const canSubmit =
		formData.company_name &&
		formData.person_incharge &&
		formData.primary_phone &&
		!isLoading
		// Address validation removed - addresses are optional for contact creation

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
											onClick={() => removeAddress(index)}
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
						<Button variant='subtle' onClick={onClose} disabled={isLoading}>
							Cancel
						</Button>
					</Group>
				</Box>
			</ScrollArea>
		</Drawer>
	)
}