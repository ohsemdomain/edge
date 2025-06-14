import {
	ActionIcon,
	Card,
	Group,
	ScrollArea,
	Stack,
	Text,
	TextInput,
	Tooltip
} from '@mantine/core'
import { CheckCircle, Search, Trash } from 'lucide-react'
import { useState } from 'react'
import toast from 'react-hot-toast'
import { trpc } from '~c/utils/trpc'

export function ItemsArchive() {
	const [search, setSearch] = useState('')

	const { data, refetch } = trpc.items.list.useQuery({
		search: '', // Always empty for server
		page: 1,
		limit: 1000, // Get all items
		status: 'inactive'
	})

	const updateStatusMutation = trpc.items.updateStatus.useMutation({
		onSuccess: () => {
			refetch()
		}
	})

	const deleteMutation = trpc.items.delete.useMutation({
		onSuccess: () => {
			refetch()
		}
	})

	// Client-side filter
	const filteredItems = search
		? data?.items?.filter((item) => item.name.toLowerCase().includes(search.toLowerCase())) || []
		: data?.items || []

	const handleActivate = (id: string) => {
		toast.promise(updateStatusMutation.mutateAsync({ id, status: 'active' }), {
			loading: 'Activating...',
			success: 'Item activated',
			error: 'Could not activate'
		})
	}

	const handleDelete = (id: string) => {
		if (window.confirm('Permanently delete this item?')) {
			toast.promise(deleteMutation.mutateAsync(id), {
				loading: 'Deleting...',
				success: 'Item deleted',
				error: 'Could not delete'
			})
		}
	}

	return (
		<Stack h='100%'>
			<TextInput
				placeholder='Search archived items...'
				leftSection={<Search size={16} />}
				value={search}
				onChange={(e) => setSearch(e.target.value)}
			/>

			<ScrollArea style={{ flex: 1 }}>
				<Stack gap='xs'>
					{filteredItems.map((item) => (
						<Card key={item.id} padding='sm' withBorder>
							<Group justify='space-between'>
								<div>
									<Text fw={500}>{item.name}</Text>
									<Text size='sm' c='dimmed' className='geist'>
										ID: {item.id.slice(0, 8)}...
									</Text>
								</div>
								<Group>
									<Tooltip label='Mark as Active' withArrow>
										<ActionIcon
											variant='light'
											size='md'
											onClick={() => handleActivate(item.id)}
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
											onClick={() => handleDelete(item.id)}
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
