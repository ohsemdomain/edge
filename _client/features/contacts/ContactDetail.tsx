// _client/features/contacts/ContactDetail.tsx
import { Button, Group, Paper, ScrollArea, Stack, Text, Title } from '@mantine/core'
import { Archive, Edit } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useArchiveActions } from '~c/lib/useArchive'
import { formatDate } from '~c/lib/formatter'
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
						<Title order={2}>{contact.legal_name}</Title>
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
								Legal Name
							</Text>
							<Text size='lg'>{contact.legal_name}</Text>
						</div>
						<div>
							<Text size='sm' c='dimmed'>
								Type
							</Text>
							<Text size='lg' className='geist'>
								{contact.is_supplier ? 'Supplier' : 'Client'}
							</Text>
						</div>
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
