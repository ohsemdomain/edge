// _client/features/items/ItemsList.tsx
import { ActionIcon, Badge, Card, Group, Stack, Text, TextInput } from '@mantine/core'
import { useVirtualizer } from '@tanstack/react-virtual'
import { Plus, Search } from 'lucide-react'
import { useRef, useState } from 'react'
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
	const parentRef = useRef<HTMLDivElement>(null)

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

	// Virtual scrolling
	const virtualizer = useVirtualizer({
		count: filteredItems.length,
		getScrollElement: () => parentRef.current,
		estimateSize: () => 70, // Estimated height of each item in pixels
		overscan: 10 // Render 10 extra items outside viewport
	})

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

			<div
				ref={parentRef}
				style={{
					height: '100%',
					width: '100%',
					overflow: 'auto',
					scrollbarWidth: 'none', // Firefox
					msOverflowStyle: 'none', // IE and Edge
				}}
				className="hide-scrollbar"
			>
				<div
					style={{
						height: `${virtualizer.getTotalSize()}px`,
						width: '100%',
						position: 'relative'
					}}
				>
					{virtualizer.getVirtualItems().map((virtualItem) => {
						const item = filteredItems[virtualItem.index]
						return (
							<div
								key={item.id}
								style={{
									position: 'absolute',
									top: 0,
									left: 0,
									width: '100%',
									height: `${virtualItem.size}px`,
									transform: `translateY(${virtualItem.start}px)`,
									paddingBottom: '8px'
								}}
							>
								<Card
									padding='sm'
									radius={0}
									withBorder
									onClick={() => onSelect(item.id)}
									style={{
										cursor: 'pointer',
										backgroundColor:
											selectedId === item.id ? 'var(--mantine-color-gray-1)' : undefined,
										borderColor: selectedId === item.id ? 'var(--mantine-color-gray-4)' : undefined
									}}
								>
									<Text fw={500}>{item.name}</Text>
									<Text className='geist' size='sm' c='dimmed'>
										ID: {item.id}
									</Text>
								</Card>
							</div>
						)
					})}
				</div>
			</div>
		</Stack>
	)
}
