import { Button, Group, Paper, ScrollArea, Stack, Text, Title } from '@mantine/core'
import { Archive, Edit } from 'lucide-react'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'
import { formatDate } from '~c/utils/formatter'
import { trpc } from '~c/utils/trpc'

interface ContactDetailProps {
	contactId: string
}

export function ContactDetail({ contactId }: ContactDetailProps) {
	const navigate = useNavigate()
	const utils = trpc.useUtils()

	const { data: contactsData } = trpc.contacts.list.useQuery({
		search: '',
		page: 1,
		limit: 100,
		status: 'active'
	})

	const updateStatusMutation = trpc.contacts.updateStatus.useMutation({
		onSuccess: () => {
			utils.contacts.list.invalidate()
			toast.success('Contact archived')
			navigate('/contacts')
		}
	})

	const contact = contactsData?.contacts.find((c) => c.id === contactId)

	if (!contact) return null

	const handleArchive = () => {
		if (window.confirm('Archive this contact?')) {
			updateStatusMutation.mutate({ id: contact.id, status: 'inactive' })
		}
	}

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
						<Title order={2}>{contact.name}</Title>
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
							onClick={handleArchive}
							loading={updateStatusMutation.isPending}
						>
							Mark as Inactive
						</Button>
					</Group>
				</Group>

				<ScrollArea flex={1}>
					<Stack p={{ base: 'md', lg: 'xl' }}>
						<div>
							<Text size='sm' c='dimmed'>
								Name
							</Text>
							<Text size='lg'>{contact.name}</Text>
						</div>

						<div>
							<Text size='sm' c='dimmed'>
								Phone
							</Text>
							<Text size='lg' className='geist'>
								{contact.phone}
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
