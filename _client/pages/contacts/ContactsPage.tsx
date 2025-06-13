import { Grid } from '@mantine/core'
import { useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { trpc } from '~c/utils/trpc'
import { ContactDetail } from './ContactDetail'
import { ContactsList } from './ContactsList'

export function ContactsPage() {
	const [searchParams, setSearchParams] = useSearchParams()

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

	return (
		<Grid gutter='md' h='calc(100vh - 120px)'>
			<Grid.Col span={4} h='100%' style={{ overflow: 'hidden' }}>
				<ContactsList selectedId={selectedId} onSelect={handleSelectContact} />
			</Grid.Col>

			<Grid.Col span={8} h='100%' style={{ overflow: 'hidden' }}>
				{selectedId ? <ContactDetail contactId={selectedId} /> : null}
			</Grid.Col>
		</Grid>
	)
}
