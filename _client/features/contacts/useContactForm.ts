import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { useNavigate, useParams } from 'react-router-dom'
import { trpc } from '~c/trpc'

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

export function useContactForm(mode: 'create' | 'edit', onSuccess?: (contactId: string) => void) {
	const navigate = useNavigate()
	const { id: contactId } = useParams()
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

	// Load contact data
	const { data: contactsData } = trpc.contacts.list.useQuery(
		{ search: '', page: 1, limit: 1000, isActive: true },
		{ enabled: mode === 'edit' }
	)

	// Load addresses
	const { data: addressesData } = trpc.contacts.getAddresses.useQuery(
		{ contactId: contactId || '' },
		{ enabled: mode === 'edit' && !!contactId }
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

			if (onSuccess) {
				onSuccess(data.id) // For invoice modal
			} else {
				navigate(`/contacts?id=${data.id}`)
			}
		}
	})

	const updateMutation = trpc.contacts.update.useMutation({
		onSuccess: () => {
			utils.contacts.list.invalidate()
			navigate(`/contacts?id=${contactId}`)
		}
	})

	const addAddressMutation = trpc.contacts.addAddress.useMutation()
	const updateAddressMutation = trpc.contacts.updateAddress.useMutation()
	const deleteAddressMutation = trpc.contacts.deleteAddress.useMutation()

	// Load existing data
	useEffect(() => {
		if (mode === 'edit' && contactId && contactsData) {
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
	}, [mode, contactId, contactsData])

	useEffect(() => {
		if (mode === 'edit' && addressesData) {
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
	}, [addressesData, mode])

	const handleSubmit = async () => {
		if (mode === 'create') {
			toast.promise(createMutation.mutateAsync(formData), {
				loading: 'Saving...',
				success: 'Contact created',
				error: 'Could not save'
			})
		} else if (contactId) {
			await toast.promise(updateMutation.mutateAsync({ id: contactId, ...formData }), {
				loading: 'Saving...',
				success: 'Contact updated',
				error: 'Could not save'
			})

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

			utils.contacts.getAddresses.invalidate()
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

	const handleCancel = () => {
		if (onSuccess) {
			// Close modal/drawer if in invoice context
			window.dispatchEvent(new Event('closeContactModal'))
		} else {
			navigate('/contacts')
		}
	}

	const isLoading = createMutation.isPending || updateMutation.isPending
	const canSubmit =
		formData.company_name &&
		formData.person_incharge &&
		formData.primary_phone &&
		!isLoading &&
		addresses.some((a) => a.is_default_billing && a.receiver && a.address_line1) && // Must have default billing
		addresses.some((a) => a.is_default_shipping && a.receiver && a.address_line1) // Must have default shipping

	return {
		formData,
		setFormData,
		addresses,
		updateAddress,
		addEmptyAddress,
		removeAddress,
		handleSubmit,
		handleCancel,
		isLoading,
		canSubmit
	}
}
