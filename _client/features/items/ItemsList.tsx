import { Button, Card, Pagination, ScrollArea, Stack, Text, TextInput } from '@mantine/core'
import { Plus, Search } from 'lucide-react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { trpc } from '~c/utils/trpc'

interface ItemsListProps {
	selectedId: string
	onSelect: (id: string) => void
}

export function ItemsList({ selectedId, onSelect }: ItemsListProps) {
	const [searchParams, setSearchParams] = useSearchParams()
	const navigate = useNavigate()
	const search = searchParams.get('search') || ''
	const page = Number(searchParams.get('page')) || 1

	const { data } = trpc.items.list.useQuery({ search, page, limit: 10 })

	const handleSearch = (value: string) => {
		const params = new URLSearchParams(searchParams)
		if (value) {
			params.set('search', value)
			params.set('page', '1')
			params.delete('id')
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

	return (
		<Stack h='100%' gap='sm'>
			<Button leftSection={<Plus size={16} />} onClick={() => navigate('/items/new')} fullWidth>
				Add Item
			</Button>

			<TextInput placeholder='Search items...' leftSection={<Search size={16} />} value={search} onChange={(e) => handleSearch(e.target.value)} />

			<ScrollArea flex={1}>
				<Stack gap='xs'>
					{data?.items.map((item) => (
						<Card
							key={item.id}
							padding='sm'
							withBorder
							onClick={() => onSelect(item.id)}
							style={{
								cursor: 'pointer',
								backgroundColor: selectedId === item.id ? 'var(--mantine-color-blue-0)' : undefined,
								borderColor: selectedId === item.id ? 'var(--mantine-color-blue-5)' : undefined
							}}
						>
							<Text fw={500}>{item.name}</Text>
							<Text className='geist' size='sm' c='dimmed'>
								ID: {item.id.slice(0, 8)}...
							</Text>
						</Card>
					))}
				</Stack>
			</ScrollArea>

			{data && data.totalPages > 1 && <Pagination value={page} onChange={handlePageChange} total={data.totalPages} size='sm' />}
		</Stack>
	)
}
