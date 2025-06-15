import {
	ActionIcon,
	Badge,
	Card,
	Group,
	Stack,
	Text,
	TextInput
} from '@mantine/core'
import { useVirtualizer } from '@tanstack/react-virtual'
import { Plus, Search } from 'lucide-react'
import { useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { trpc } from '~c/trpc'

interface ContactsListProps {
	selectedId: string
	onSelect: (id: string) => void
}

export function ContactsList({ selectedId, onSelect }: ContactsListProps) {
	const [searchParams, setSearchParams] = useSearchParams()
	const navigate = useNavigate()
	const [search, setSearch] = useState('')
	const parentRef = useRef<HTMLDivElement>(null)

	// Load all contacts at once
	const { data } = trpc.contacts.list.useQuery({
		search: '', // Always empty for server
		page: 1,
		limit: 1000, // Get all contacts
		isActive: true
	})

	// Client-side filter
	const filteredContacts = search
		? data?.contacts?.filter((contact) =>
				contact.legal_name.toLowerCase().includes(search.toLowerCase())
		  ) || []
		: data?.contacts || []

	// Virtual scrolling
	const virtualizer = useVirtualizer({
		count: filteredContacts.length,
		getScrollElement: () => parentRef.current,
		estimateSize: () => 70, // Estimated height of each contact item in pixels
		overscan: 10 // Render 10 extra items outside viewport
	})

	const handleSearch = (value: string) => {
		setSearch(value)
		// Still update URL for selected contact clearing
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
					placeholder='Search contacts...'
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
				<ActionIcon size='input-sm' variant='filled' onClick={() => navigate('/contacts/new')}>
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
						const contact = filteredContacts[virtualItem.index]
						return (
							<div
								key={contact.id}
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
									withBorder
									radius={0}
									onClick={() => onSelect(contact.id)}
									style={{
										cursor: 'pointer',
										backgroundColor:
											selectedId === contact.id ? 'var(--mantine-color-gray-1)' : undefined,
										borderColor: selectedId === contact.id ? 'var(--mantine-color-gray-4)' : undefined
									}}
								>
									<Group justify="space-between" align="start">
										<Text fw={500}>{contact.legal_name.toUpperCase()}</Text>
										<Text size='sm' fw={500}>
											{contact.is_supplier ? 'Supplier' : 'Client'}
										</Text>
									</Group>
									<Text className='geist' size='sm' c='dimmed'>
										{contact.id}
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
