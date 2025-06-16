// _client/features/invoices/AddressDisplay.tsx
import { ActionIcon, Group, Paper, Stack, Text } from '@mantine/core'
import { Edit } from 'lucide-react'

interface Address {
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

interface Contact {
	id: string
	name: string
	email?: string
	billingAddress?: Address
	shippingAddress?: Address
}

interface AddressDisplayProps {
	contact: Contact
	onEditContact: (contactId: string) => void
}

export function AddressDisplay({ contact, onEditContact }: AddressDisplayProps) {
	const formatAddress = (address: Address) => (
		<div>
			<Text size='sm'>{address.receiver}</Text>
			<Text size='sm'>{address.address_line1}</Text>
			{address.address_line2 && <Text size='sm'>{address.address_line2}</Text>}
			{address.address_line3 && <Text size='sm'>{address.address_line3}</Text>}
			{address.address_line4 && <Text size='sm'>{address.address_line4}</Text>}
			<Text size='sm'>{address.postcode} {address.city}</Text>
			<Text size='sm'>{address.state}, {address.country}</Text>
		</div>
	)

	return (
		<Paper withBorder p='md' bg='gray.0'>
			<Stack gap='sm'>
				{/* Addresses */}
				{(contact.billingAddress || contact.shippingAddress) && (
					<Group grow align='flex-start' gap='md'>
						{contact.billingAddress && (
							<div>
								<Group align='center' gap='xs' mb='xs'>
									<Text size='sm' fw={500}>Billing Address</Text>
									<ActionIcon
										variant='transparent'
										size='xs'
										onClick={() => onEditContact(contact.id)}
									>
										<Edit size={12} />
									</ActionIcon>
								</Group>
								{formatAddress(contact.billingAddress)}
							</div>
						)}
						
						{contact.shippingAddress && (
							<div>
								<Group align='center' gap='xs' mb='xs'>
									<Text size='sm' fw={500}>Shipping Address</Text>
									<ActionIcon
										variant='transparent'
										size='xs'
										onClick={() => onEditContact(contact.id)}
									>
										<Edit size={12} />
									</ActionIcon>
								</Group>
								{formatAddress(contact.shippingAddress)}
							</div>
						)}
					</Group>
				)}

				{/* No Address Message */}
				{!contact.billingAddress && !contact.shippingAddress && (
					<Text size='sm' c='dimmed' fs='italic'>
						No addresses found. Click the "Edit" button to add addresses.
					</Text>
				)}
			</Stack>
		</Paper>
	)
}