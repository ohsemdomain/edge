import {
	ActionIcon,
	Badge,
	Card,
	Group,
	ScrollArea,
	Stack,
	Text,
	TextInput
} from '@mantine/core'
import { Plus, Search } from 'lucide-react'
import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { trpc } from '~c/utils/trpc'

interface ContactsListProps {
	selectedId: string
	onSelect: (id: string) => void
}

export function ContactsList({ selectedId, onSelect }: ContactsListProps) {
	const [searchParams, setSearchParams] = useSearchParams()
	const navigate = useNavigate()
	const [search, setSearch] = useState('')

	// Load all contacts at once
	const { data } = trpc.contacts.list.useQuery({
		search: '', // Always empty for server
		page: 1,
		limit: 1000, // Get all contacts
		status: 'active'
	})

	// Client-side filter
	const filteredContacts = search
		? data?.contacts?.filter((contact) =>
				contact.name.toLowerCase().includes(search.toLowerCase()) ||
				contact.phone.includes(search)
		  ) || []
		: data?.contacts || []

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

			<ScrollArea flex={1} type='never'>
				<Stack gap='xs'>
					{filteredContacts.map((contact) => (
						<Card
							key={contact.id}
							padding='sm'
							withBorder
							onClick={() => onSelect(contact.id)}
							style={{
								cursor: 'pointer',
								backgroundColor:
									selectedId === contact.id ? 'var(--mantine-color-gray-1)' : undefined,
								borderColor: selectedId === contact.id ? 'var(--mantine-color-gray-4)' : undefined
							}}
						>
							<Text fw={500}>{contact.name}</Text>
							<Text className='geist' size='sm' c='dimmed'>
								{contact.phone}
							</Text>
						</Card>
					))}
				</Stack>
			</ScrollArea>
		</Stack>
	)
}
