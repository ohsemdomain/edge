import { Button, Card, Group, Pagination, Stack, Text, TextInput } from '@mantine/core'
import { CheckCircle, Search, Trash } from 'lucide-react'
import toast from 'react-hot-toast'
import { useSearchParams } from 'react-router-dom'
import { trpc } from '../../utils/trpc'

export function ItemsArchive() {
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
			toast.success('Contact activated')
		}
	})

	const deleteMutation = trpc.contacts.delete.useMutation({
		onSuccess: () => {
			refetch()
			toast.success('Contact deleted')
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
		updateStatusMutation.mutate({ id, status: 'active' })
	}

	const handleDelete = (id: string) => {
		if (window.confirm('Permanently delete this contact?')) {
			deleteMutation.mutate(id)
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
								<Button
									size='xs'
									leftSection={<CheckCircle size={14} />}
									onClick={() => handleActivate(contact.id)}
									loading={updateStatusMutation.isPending}
								>
									Mark as Active
								</Button>
								<Button
									size='xs'
									color='red'
									leftSection={<Trash size={14} />}
									onClick={() => handleDelete(contact.id)}
									loading={deleteMutation.isPending}
								>
									Delete
								</Button>
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

			{data && data.totalPages > 1 && <Pagination value={page} onChange={handlePageChange} total={data.totalPages} size='sm' />}
		</Stack>
	)
}
