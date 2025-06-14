import { ActionIcon, Card, Group, Pagination, Stack, Text, TextInput, Tooltip } from '@mantine/core'
import { CheckCircle, Search, Trash } from 'lucide-react'
import toast from 'react-hot-toast'
import { useSearchParams } from 'react-router-dom'
import { trpc } from '~c/utils/trpc'

export function ContactsArchive() {
	const [searchParams, setSearchParams] = useSearchParams()
	const search = searchParams.get('search') || ''
	const page = Number(searchParams.get('page')) || 1

	const { data, refetch } = trpc.contacts.list.useQuery({
		search,
		page,
		limit: 10,
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

	const handleSearch = (value: string) => {
		const params = new URLSearchParams(searchParams)
		if (value) {
			params.set('search', value)
			params.set('page', '1')
		} else {
			params.delete('search')
		}
		setSearchParams(params)
	}

	const handlePageChange = (newPage: number) => {
		const params = new URLSearchParams(searchParams)
		params.set('page', newPage.toString())
		setSearchParams(params)
	}

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
				onChange={(e) => handleSearch(e.target.value)}
			/>

			<Stack gap='xs'>
				{data?.contacts.map((contact) => (
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
										loading={updateStatusMutation.isPending}
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
										loading={deleteMutation.isPending}
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

			{data?.totalItems === 0 && (
				<Text c='dimmed' ta='center'>
					No archived contacts
				</Text>
			)}

			{data && data.totalPages > 1 && (
				<Pagination value={page} onChange={handlePageChange} total={data.totalPages} size='sm' />
			)}
		</Stack>
	)
}
