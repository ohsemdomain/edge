import { ActionIcon, Card, Group, ScrollArea, Stack, Text, TextInput, Tooltip } from '@mantine/core'
import { CheckCircle, Search, Trash } from 'lucide-react'
import { useState } from 'react'
import toast from 'react-hot-toast'
import { trpc } from '~c/utils/trpc'

export function ContactsArchive() {
	const [search, setSearch] = useState('')

	const { data, refetch } = trpc.contacts.list.useQuery({
		search: '', // Always empty for server
		page: 1,
		limit: 1000, // Get all contacts
		status: 'inactive'
	})

	const updateStatusMutation = trpc.contacts.updateStatus.useMutation({
		onSuccess: () => {
			refetch()
		}
	})

	const deleteMutation = trpc.contacts.delete.useMutation({
		onSuccess: () => {
			refetch()
		}
	})

	// Client-side filter
	const filteredContacts = search
		? data?.contacts?.filter((contact) =>
				contact.name.toLowerCase().includes(search.toLowerCase()) ||
				contact.phone.includes(search)
		  ) || []
		: data?.contacts || []

	const handleActivate = (id: string) => {
		toast.promise(updateStatusMutation.mutateAsync({ id, status: 'active' }), {
			loading: 'Activating...',
			success: 'Contact activated',
			error: 'Could not activate'
		})
	}

	const handleDelete = (id: string) => {
		if (window.confirm('Permanently delete this contact?')) {
			toast.promise(deleteMutation.mutateAsync(id), {
				loading: 'Deleting...',
				success: 'Contact deleted',
				error: 'Could not delete'
			})
		}
	}

	return (
		<Stack>
			<TextInput
				placeholder='Search archived contacts...'
				leftSection={<Search size={16} />}
				value={search}
				onChange={(e) => setSearch(e.target.value)}
			/>

			<ScrollArea style={{ flex: 1 }}>
				<Stack gap='xs'>
					{filteredContacts.map((contact) => (
					<Card key={contact.id} padding='sm' withBorder>
						<Group justify='space-between'>
							<div>
								<Text fw={500}>{contact.name}</Text>
								<Text size='sm' c='dimmed'>
									{contact.phone}
								</Text>
							</div>
							<Group>
								<Tooltip label='Mark as Active' withArrow>
									<ActionIcon
										variant='light'
										size='md'
										onClick={() => handleActivate(contact.id)}
										disabled={updateStatusMutation.isPending}
										aria-label='Mark as Active'
									>
										<CheckCircle size={14} />
									</ActionIcon>
								</Tooltip>

								<Tooltip label='Delete' withArrow>
									<ActionIcon
										variant='light'
										color='red'
										size='md'
										onClick={() => handleDelete(contact.id)}
										disabled={deleteMutation.isPending}
										aria-label='Delete'
									>
										<Trash size={14} />
									</ActionIcon>
								</Tooltip>
							</Group>
						</Group>
					</Card>
					))}
				</Stack>
			</ScrollArea>
		</Stack>
	)
}
