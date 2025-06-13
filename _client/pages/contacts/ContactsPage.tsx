import { Button, Center, Grid, Stack, Text } from '@mantine/core'
import { Plus } from 'lucide-react'
import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { trpc } from '../../utils/trpc'
import { ContactDetail } from './ContactDetail'
import { ContactsList } from './ContactsList'

export function ContactsPage() {
	const [searchParams, setSearchParams] = useSearchParams()
	const navigate = useNavigate()

	const selectedId = searchParams.get('id') || ''
	const search = searchParams.get('search') || ''
	const page = Number(searchParams.get('page')) || 1

	const { data } = trpc.contacts.list.useQuery({ search, page, limit: 10 })

	// Auto-select first contact if none selected
	useEffect(() => {
		if (data?.contacts.length && !selectedId) {
			const params = new URLSearchParams(searchParams)
			params.set('id', data.contacts[0].id)
			setSearchParams(params)
		}
	}, [data?.contacts, selectedId])

	const handleSelectContact = (id: string) => {
		const params = new URLSearchParams(searchParams)
		params.set('id', id)
		setSearchParams(params)
	}

	// Empty state - no contacts at all
	if (data?.totalItems === 0 && !search) {
		return (
			<Center h='calc(100vh - 120px)'>
				<Stack align='center' gap='md'>
					<Text size='lg' c='dimmed'>
						Create new data
					</Text>
					<Button leftSection={<Plus size={16} />} onClick={() => navigate('/contacts/new')}>
						Add Contact
					</Button>
				</Stack>
			</Center>
		)
	}

	return (
		<Grid gutter='md' h='calc(100vh - 120px)'>
			<Grid.Col span={4} h='100%' style={{ overflow: 'hidden' }}>
				<ContactsList selectedId={selectedId} onSelect={handleSelectContact} />
			</Grid.Col>

			<Grid.Col span={8} h='100%' style={{ overflow: 'hidden' }}>
				{selectedId ? (
					<ContactDetail contactId={selectedId} />
				) : (
					<Center h='100%'>
						<Text c='dimmed'>No contact selected</Text>
					</Center>
				)}
			</Grid.Col>
		</Grid>
	)
}
