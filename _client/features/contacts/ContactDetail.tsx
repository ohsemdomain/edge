// _client/features/contacts/ContactDetail.tsx
import { Button, Group, Paper, ScrollArea, Stack, Text, Title } from '@mantine/core'
import { Edit, Trash2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { formatUnixTimestamp } from '~c/lib/formatter'
import { trpc } from '~c/trpc'

interface ContactDetailProps {
	contactId: string
}

export function ContactDetail({ contactId }: ContactDetailProps) {
	const navigate = useNavigate()
	const utils = trpc.useUtils()

	const { data: contactsData } = trpc.contacts.list.useQuery({
		page: 1,
		limit: 1000
	})

	const { data: addresses } = trpc.contacts.listAddresses.useQuery(contactId)

	const deleteMutation = trpc.contacts.delete.useMutation({
		onSuccess: () => {
			toast.success('Contact deleted successfully')
			utils.contacts.list.invalidate()
			navigate('/contacts')
		},
		onError: (error) => {
			toast.error(error.message || 'Failed to delete contact')
		}
	})

	const handleDelete = () => {
		if (window.confirm('Are you sure you want to delete this contact? This will also delete all associated invoices and payments.')) {
			deleteMutation.mutate(contactId)
		}
	}


	const contact = contactsData?.contacts.find((c) => c.id === contactId)

	if (!contact) return null

	return (
		<Paper h='100%' withBorder style={{ overflow: 'hidden' }}>
			<Stack h='100%' gap={0}>
				<Group
					bg='gray.0'
					p='md'
					px={{ base: 'md', lg: 'xl' }}
					justify='space-between'
					align='center'
					className='border-b border-gray-200'
				>
					<div>
						<Title order={2}>{contact.companyName.toUpperCase()}</Title>
						<Text c='dimmed' size='sm'>
							Contact Details
						</Text>
					</div>
					<Group>
						<Button
							leftSection={<Edit size={16} />}
							onClick={() => navigate(`/contacts/edit/${contact.id}`)}
						>
							Edit
						</Button>
						<Button
							color="red"
							variant="light"
							leftSection={<Trash2 size={16} />}
							onClick={handleDelete}
						>
							Delete
						</Button>
					</Group>
				</Group>

				<ScrollArea flex={1}>
					<Stack p={{ base: 'md', lg: 'xl' }}>
						<div>
							<Text size='sm' c='dimmed'>
								Company Name
							</Text>
							<Text size='lg'>{contact.companyName.toUpperCase()}</Text>
						</div>

						<div>
							<Text size='sm' c='dimmed'>
								Person In Charge
							</Text>
							<Text size='lg'>{contact.personIncharge}</Text>
						</div>

						<div>
							<Text size='sm' c='dimmed'>
								Primary Phone
							</Text>
							<Text size='lg' className='geist'>
								{contact.primaryPhone}
							</Text>
						</div>

						{contact.email && (
							<div>
								<Text size='sm' c='dimmed'>
									Email
								</Text>
								<Text size='lg'>{contact.email}</Text>
							</div>
						)}

						{contact.phoneAlt1 && (
							<div>
								<Text size='sm' c='dimmed'>
									Alternative Phone 1
								</Text>
								<Text size='lg' className='geist'>
									{contact.phoneAlt1}
								</Text>
							</div>
						)}

						{contact.phoneAlt2 && (
							<div>
								<Text size='sm' c='dimmed'>
									Alternative Phone 2
								</Text>
								<Text size='lg' className='geist'>
									{contact.phoneAlt2}
								</Text>
							</div>
						)}

						{contact.phoneAlt3 && (
							<div>
								<Text size='sm' c='dimmed'>
									Alternative Phone 3
								</Text>
								<Text size='lg' className='geist'>
									{contact.phoneAlt3}
								</Text>
							</div>
						)}

						<div>
							<Text size='sm' c='dimmed'>
								Type
							</Text>
							<Text size='lg' className='geist'>
								{contact.isSupplier ? 'Supplier' : 'Client'}
							</Text>
						</div>

						{/* Addresses Section */}
						{addresses && addresses.length > 0 && (
							<>
								<Text fw={600} size='lg' mt='md'>
									Addresses
								</Text>
								{addresses.map((addr: any, index: number) => (
									<Paper key={addr.id} p='md' withBorder>
										<Stack gap='xs'>
											<Group justify='space-between'>
												<Text fw={500}>Address {index + 1}</Text>
												<Group gap='xs'>
													{addr.isDefaultBilling && (
														<Text size='sm' c='blue'>
															Default Billing
														</Text>
													)}
													{addr.isDefaultShipping && (
														<Text size='sm' c='green'>
															Default Shipping
														</Text>
													)}
												</Group>
											</Group>

											<Text size='sm'>{addr.receiver}</Text>
											<Text size='sm'>{addr.addressLine1}</Text>
											{addr.addressLine2 && <Text size='sm'>{addr.addressLine2}</Text>}
											{addr.addressLine3 && <Text size='sm'>{addr.addressLine3}</Text>}
											{addr.addressLine4 && <Text size='sm'>{addr.addressLine4}</Text>}
											<Text size='sm'>
												{addr.postcode} {addr.city}
											</Text>
											<Text size='sm'>
												{addr.state}, {addr.country}
											</Text>
										</Stack>
									</Paper>
								))}
							</>
						)}

						<div>
							<Text size='sm' c='dimmed'>
								ID
							</Text>
							<Text size='lg' className='geist'>
								{contact.id}
							</Text>
						</div>
						<div>
							<Text size='sm' c='dimmed'>
								Created
							</Text>
							<Text className='geist'>
								{formatUnixTimestamp(contact.createdAt)}
							</Text>
						</div>
					</Stack>
				</ScrollArea>
			</Stack>
		</Paper>
	)
}
