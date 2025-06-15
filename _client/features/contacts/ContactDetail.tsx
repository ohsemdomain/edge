// _client/features/contacts/ContactDetail.tsx
import { Button, Group, Paper, ScrollArea, Stack, Text, Title } from '@mantine/core'
import { Archive, Edit } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { formatDate } from '~c/lib/formatter'
import { useArchiveActions } from '~c/lib/useArchive'
import { trpc } from '~c/trpc'

interface ContactDetailProps {
	contactId: string
}

export function ContactDetail({ contactId }: ContactDetailProps) {
	const navigate = useNavigate()

	const { data: contactsData } = trpc.contacts.list.useQuery({
		search: '',
		page: 1,
		limit: 1000,
		isActive: true
	})

	const { data: addresses } = trpc.contacts.getAddresses.useQuery({
		contactId
	})

	const { handleToggleActive, isToggling } = useArchiveActions('contacts', () => {
		navigate('/contacts')
	})

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
						<Title order={2}>{contact.company_name.toUpperCase()}</Title>
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
							bg='gray.1'
							c='dimmed'
							leftSection={<Archive size={16} />}
							onClick={() => {
								if (window.confirm('Move this contact to archive?')) {
									handleToggleActive(contact.id, true)
								}
							}}
							disabled={isToggling}
						>
							Archive
						</Button>
					</Group>
				</Group>

				<ScrollArea flex={1}>
					<Stack p={{ base: 'md', lg: 'xl' }}>
						<div>
							<Text size='sm' c='dimmed'>
								Company Name
							</Text>
							<Text size='lg'>{contact.company_name.toUpperCase()}</Text>
						</div>

						<div>
							<Text size='sm' c='dimmed'>
								Person In Charge
							</Text>
							<Text size='lg'>{contact.person_incharge}</Text>
						</div>

						<div>
							<Text size='sm' c='dimmed'>
								Primary Phone
							</Text>
							<Text size='lg' className='geist'>
								{contact.primary_phone}
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

						{contact.phone_alt_1 && (
							<div>
								<Text size='sm' c='dimmed'>
									Alternative Phone 1
								</Text>
								<Text size='lg' className='geist'>
									{contact.phone_alt_1}
								</Text>
							</div>
						)}

						{contact.phone_alt_2 && (
							<div>
								<Text size='sm' c='dimmed'>
									Alternative Phone 2
								</Text>
								<Text size='lg' className='geist'>
									{contact.phone_alt_2}
								</Text>
							</div>
						)}

						{contact.phone_alt_3 && (
							<div>
								<Text size='sm' c='dimmed'>
									Alternative Phone 3
								</Text>
								<Text size='lg' className='geist'>
									{contact.phone_alt_3}
								</Text>
							</div>
						)}

						<div>
							<Text size='sm' c='dimmed'>
								Type
							</Text>
							<Text size='lg' className='geist'>
								{contact.is_supplier ? 'Supplier' : 'Client'}
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
													{addr.is_default_billing && (
														<Text size='sm' c='blue'>
															Default Billing
														</Text>
													)}
													{addr.is_default_shipping && (
														<Text size='sm' c='green'>
															Default Shipping
														</Text>
													)}
												</Group>
											</Group>

											<Text size='sm'>{addr.receiver}</Text>
											<Text size='sm'>{addr.address_line1}</Text>
											{addr.address_line2 && <Text size='sm'>{addr.address_line2}</Text>}
											{addr.address_line3 && <Text size='sm'>{addr.address_line3}</Text>}
											{addr.address_line4 && <Text size='sm'>{addr.address_line4}</Text>}
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
								{formatDate(Math.floor(new Date(contact.createdAt).getTime() / 1000))}
							</Text>
						</div>
					</Stack>
				</ScrollArea>
			</Stack>
		</Paper>
	)
}
