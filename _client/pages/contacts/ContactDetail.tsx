import { Button, Card, Group, Stack, Text, Title } from '@mantine/core'
import { Edit, Trash } from 'lucide-react'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'
import { trpc } from '../../utils/trpc'

interface ContactDetailProps {
	contactId: string
}

export function ContactDetail({ contactId }: ContactDetailProps) {
	const navigate = useNavigate()
	const utils = trpc.useUtils()

	const { data: contactsData } = trpc.contacts.list.useQuery({
		search: '',
		page: 1,
		limit: 100
	})

	const deleteMutation = trpc.contacts.delete.useMutation({
		onSuccess: () => {
			utils.contacts.list.invalidate()
			toast.success('Contact deleted')
			navigate('/contacts')
		}
	})

	const contact = contactsData?.contacts.find((c) => c.id === contactId)

	if (!contact) return <Text>Contact not found</Text>

	const handleDelete = () => {
		if (window.confirm('Are you sure you want to delete this contact?')) {
			deleteMutation.mutate(contact.id)
		}
	}

	return (
		<Card h='100%' padding='lg'>
			<Stack>
				<Group justify='space-between' align='start'>
					<div>
						<Title order={2}>{contact.name}</Title>
						<Text c='dimmed' size='sm'>
							Contact Details
						</Text>
					</div>
					<Group>
						<Button leftSection={<Edit size={16} />} onClick={() => navigate(`/contacts/edit/${contact.id}`)}>
							Edit
						</Button>
						<Button color='red' leftSection={<Trash size={16} />} onClick={handleDelete} loading={deleteMutation.isPending}>
							Delete
						</Button>
					</Group>
				</Group>

				<Stack gap='md' mt='xl'>
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
						<Text size='lg'>{contact.phone}</Text>
					</div>

					<div>
						<Text size='sm' c='dimmed'>
							Created
						</Text>
						<Text>{new Date(contact.createdAt).toLocaleDateString()}</Text>
					</div>
				</Stack>
			</Stack>
		</Card>
	)
}
