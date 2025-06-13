import { Button, Card, Pagination, ScrollArea, Stack, Text, TextInput } from '@mantine/core'
import { Plus, Search } from 'lucide-react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { trpc } from '~c/utils/trpc'

interface ContactsListProps {
	selectedId: string
	onSelect: (id: string) => void
}

export function ContactsList({ selectedId, onSelect }: ContactsListProps) {
	const [searchParams, setSearchParams] = useSearchParams()
	const navigate = useNavigate()
	const search = searchParams.get('search') || ''
	const page = Number(searchParams.get('page')) || 1

	const { data } = trpc.contacts.list.useQuery({ search, page, limit: 10 })

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
			<Button leftSection={<Plus size={16} />} onClick={() => navigate('/contacts/new')} fullWidth>
				Add Contact
			</Button>

			<TextInput placeholder='Search contacts...' leftSection={<Search size={16} />} value={search} onChange={(e) => handleSearch(e.target.value)} />

			<ScrollArea flex={1}>
				<Stack gap='xs'>
					{data?.contacts.map((contact) => (
						<Card
							key={contact.id}
							padding='sm'
							withBorder
							onClick={() => onSelect(contact.id)}
							style={{
								cursor: 'pointer',
								backgroundColor: selectedId === contact.id ? 'var(--mantine-color-blue-0)' : undefined,
								borderColor: selectedId === contact.id ? 'var(--mantine-color-blue-5)' : undefined
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

			{data && data.totalPages > 1 && <Pagination value={page} onChange={handlePageChange} total={data.totalPages} size='sm' />}
		</Stack>
	)
}
