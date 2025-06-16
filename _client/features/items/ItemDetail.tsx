// _client/features/items/ItemDetail.tsx
import { Button, Group, Paper, ScrollArea, Stack, Text, Title } from '@mantine/core'
import { Archive, Edit } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { formatDate } from '~c/lib/formatter'
import { trpc } from '~c/trpc'

interface ItemDetailProps {
	itemId: string
}

export function ItemDetail({ itemId }: ItemDetailProps) {
	const navigate = useNavigate()
	const utils = trpc.useUtils()

	const { data: itemsData } = trpc.items.list.useQuery({
		page: 1,
		limit: 1000,
		isActive: true
	})

	const toggleActiveMutation = trpc.items.toggleActive.useMutation({
		onSuccess: () => {
			navigate('/items')
			utils.items.list.invalidate()
		}
	})

	const handleToggleActive = (id: string, currentlyActive: boolean) => {
		const action = currentlyActive ? 'Archiving' : 'Restoring'
		const actionPast = currentlyActive ? 'archived' : 'restored'

		toast.promise(toggleActiveMutation.mutateAsync({ id }), {
			loading: `${action}...`,
			success: `Successfully ${actionPast}`,
			error: `Could not ${action.toLowerCase()}`
		})
	}

	const item = itemsData?.items.find((i) => i.id === itemId)

	if (!item) return null

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
						<Title order={2}>{item.name}</Title>
						<Text c='dimmed' size='sm'>
							Item Details
						</Text>
					</div>
					<Group>
						<Button
							leftSection={<Edit size={16} />}
							onClick={() => navigate(`/items/edit/${item.id}`)}
						>
							Edit
						</Button>
						<Button
							bg='gray.1'
							c='dimmed'
							leftSection={<Archive size={16} />}
							onClick={() => {
								if (window.confirm('Move this item to archive?')) {
									handleToggleActive(item.id, item.is_active)
								}
							}}
							disabled={toggleActiveMutation.isPending}
						>
							Archive
						</Button>
					</Group>
				</Group>

				<ScrollArea flex={1}>
					<Stack p={{ base: 'md', lg: 'xl' }}>
						<div>
							<Text size='sm' c='dimmed'>
								Name
							</Text>
							<Text size='lg'>{item.name}</Text>
						</div>

						<div>
							<Text size='sm' c='dimmed'>
								Description
							</Text>
							<Text size='lg'>{item.description}</Text>
						</div>

						<div>
							<Text size='sm' c='dimmed'>
								Unit Price
							</Text>
							<Text size='lg'>${item.unit_price.toFixed(2)}</Text>
						</div>

						<div>
							<Text size='sm' c='dimmed'>
								ID
							</Text>
							<Text size='lg' className='geist'>
								{item.id}
							</Text>
						</div>

						<div>
							<Text size='sm' c='dimmed'>
								Created
							</Text>
							<Text className='geist'>{formatDate(item.created_at)}</Text>
						</div>
					</Stack>
				</ScrollArea>
			</Stack>
		</Paper>
	)
}
