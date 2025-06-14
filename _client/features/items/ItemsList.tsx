// _client/features/items/ItemsList.tsx
import { ActionIcon, Badge, Card, Group, ScrollArea, Stack, Text, TextInput } from '@mantine/core'
import { Plus, Search } from 'lucide-react'
import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { trpc } from '~c/utils/trpc'

interface ItemsListProps {
	selectedId: string
	onSelect: (id: string) => void
}

export function ItemsList({ selectedId, onSelect }: ItemsListProps) {
	const [searchParams, setSearchParams] = useSearchParams()
	const navigate = useNavigate()
	const [search, setSearch] = useState('')

	// Load all items at once
	const { data } = trpc.items.list.useQuery({
		search: '', // Always empty for server
		page: 1,
		limit: 1000, // Get all items
		status: 'active'
	})

	// Client-side filter
	const filteredItems = search
		? data?.items?.filter((item) => item.name.toLowerCase().includes(search.toLowerCase())) || []
		: data?.items || []

	const handleSearch = (value: string) => {
		setSearch(value)
		// Still update URL for selected item clearing
		if (value) {
			const params = new URLSearchParams(searchParams)
			params.delete('id')
			setSearchParams(params)
		}
	}

	return (
		<Stack h='100%' gap='sm'>
			<Group gap='xs' align='stretch'>
				<TextInput
					placeholder='Search items...'
					leftSection={<Search size={16} />}
					value={search}
					onChange={(e) => handleSearch(e.target.value)}
					style={{ flex: 1 }}
				/>
				<Badge
					size='lg'
					radius='sm'
					bg='gray.2'
					c='gray.5'
					style={{
						height: 'var(--input-height, 36px)',
						paddingInline: 12,
						minWidth: 50
					}}
				>
					{data?.totalItems || 0}
				</Badge>
				<ActionIcon size='input-sm' variant='filled' onClick={() => navigate('/items/new')}>
					<Plus size={18} />
				</ActionIcon>
			</Group>

			<ScrollArea flex={1} type='never'>
				<Stack gap='xs'>
					{filteredItems.map((item) => (
						<Card
							key={item.id}
							padding='sm'
							withBorder
							onClick={() => onSelect(item.id)}
							style={{
								cursor: 'pointer',
								backgroundColor: selectedId === item.id ? 'var(--mantine-color-gray-1)' : undefined,
								borderColor: selectedId === item.id ? 'var(--mantine-color-gray-4)' : undefined
							}}
						>
							<Text fw={500}>{item.name}</Text>
							<Text className='geist' size='sm' c='dimmed'>
								ID: {item.id}
							</Text>
						</Card>
					))}
				</Stack>
			</ScrollArea>
		</Stack>
	)
}
