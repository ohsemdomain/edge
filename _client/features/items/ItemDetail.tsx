import { Button, Group, Paper, ScrollArea, Stack, Text, Title } from '@mantine/core'
import { Archive, Edit } from 'lucide-react'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'
import { formatDate } from '~c/utils/formatter'
import { trpc } from '~c/utils/trpc'

interface ItemDetailProps {
	itemId: string
}

export function ItemDetail({ itemId }: ItemDetailProps) {
	const navigate = useNavigate()
	const utils = trpc.useUtils()

	const { data: itemsData } = trpc.items.list.useQuery({
		search: '',
		page: 1,
		limit: 100,
		status: 'active'
	})

	const updateStatusMutation = trpc.items.updateStatus.useMutation({
		onSuccess: () => {
			utils.items.list.invalidate()
			navigate('/items')
		}
	})

	const item = itemsData?.items.find((i) => i.id === itemId)

	if (!item) return null

	const handleArchive = () => {
		if (window.confirm('Archive this item?')) {
			toast.promise(updateStatusMutation.mutateAsync({ id: item.id, status: 'inactive' }), {
				loading: 'Archiving...',
				success: 'Item archived',
				error: 'Could not archive'
			})
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
							onClick={handleArchive}
							disabled={updateStatusMutation.isPending}
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
							<Text size='lg'>{item.name}</Text>
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
							<Text className='geist'>
								{formatDate(Math.floor(new Date(item.createdAt).getTime() / 1000))}
							</Text>
						</div>
					</Stack>
				</ScrollArea>
			</Stack>
		</Paper>
	)
}
