// _client/features/items/ItemDetail.tsx
import {
	Badge,
	Button,
	Divider,
	Grid,
	Group,
	Paper,
	ScrollArea,
	Stack,
	Text,
	Title
} from '@mantine/core'
import { Edit, Info, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'
import { formatCurrency, formatUnixTimestamp } from '~c/lib/formatter'
import { trpc } from '~c/trpc'

interface ItemDetailProps {
	itemId: string
}

export function ItemDetail({ itemId }: ItemDetailProps) {
	const navigate = useNavigate()
	const utils = trpc.useUtils()

	const { data: itemsData } = trpc.items.list.useQuery({
		page: 1,
		limit: 1000
	})

	const deleteMutation = trpc.items.delete.useMutation({
		onSuccess: () => {
			toast.success('Item deleted successfully')
			utils.items.list.invalidate()
			navigate('/items')
		},
		onError: (error) => {
			toast.error(error.message || 'Failed to delete item')
		}
	})

	const handleDelete = () => {
		if (window.confirm('Are you sure you want to delete this item?')) {
			deleteMutation.mutate(itemId)
		}
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
						<Title order={3} fw={600}>
							{item.name.toUpperCase()}
						</Title>
						<Group gap='4' align='center'>
							<Info size={20} className='text-gray-400' />
							<Text c='dimmed' size='lg'>
								{item.id}
							</Text>
						</Group>
					</div>
					<Group>
						<Button
							leftSection={<Edit size={16} />}
							onClick={() => navigate(`/items/edit/${item.id}`)}
						>
							Edit
						</Button>
						<Button
							color='red'
							variant='light'
							leftSection={<Trash2 size={16} />}
							onClick={handleDelete}
						>
							Delete
						</Button>
					</Group>
				</Group>

				<ScrollArea flex={1}>
					<Stack p={{ base: 'md', lg: 'xl' }}>
						<Grid gutter='md'>
							<Grid.Col span={{ base: 12, lg: 2 }}>
								<Text c='gray.5'>Description:</Text>
							</Grid.Col>
							<Grid.Col span={{ base: 12, lg: 10 }}>
								<Text style={{ whiteSpace: 'pre-wrap' }}>{item.description}</Text>
							</Grid.Col>
							<Grid.Col span={{ base: 12, lg: 2 }}>
								<Text c='gray.5'>Selling Price:</Text>
							</Grid.Col>
							<Grid.Col span={{ base: 12, lg: 10 }}>
								<Text>{formatCurrency(item.unitPrice)}</Text>
							</Grid.Col>
						</Grid>

						<Divider my='sm' />

						<Badge bg='blue.0' variant='subtle' fw={500}>
							{formatUnixTimestamp(item.createdAt)}
						</Badge>
					</Stack>
				</ScrollArea>
			</Stack>
		</Paper>
	)
}
