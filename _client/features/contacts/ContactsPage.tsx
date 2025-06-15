import { Drawer, Grid } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { trpc } from '~c/trpc'
import { ContactDetail } from './ContactDetail'
import { ContactsList } from './ContactsList'

export function ContactsPage() {
	const [searchParams, setSearchParams] = useSearchParams()
	const [drawerOpened, { open: openDrawer, close: closeDrawer }] = useDisclosure(false)

	const selectedId = searchParams.get('id') || ''

	const { data } = trpc.contacts.list.useQuery({
		search: '',
		page: 1,
		limit: 1000,
		isActive: true
	})

	// Auto-select first contact if none selected on desktop
	useEffect(() => {
		if (data?.contacts.length && !selectedId && window.innerWidth >= 1024) {
			const params = new URLSearchParams(searchParams)
			params.set('id', data.contacts[0].id)
			setSearchParams(params)
		}
	}, [data?.contacts, selectedId, searchParams, setSearchParams])

	const handleSelectContact = (id: string) => {
		const params = new URLSearchParams(searchParams)
		params.set('id', id)
		setSearchParams(params)
		
		// Open drawer on mobile when selecting a contact
		if (window.innerWidth < 1024) {
			openDrawer()
		}
	}

	return (
		<>
			<Grid gutter='md' p='md' style={{ height: '100%', display: 'flex' }}>
			<Grid.Col h='100%' span={{ base: 12, lg: 4 }}>
					<ContactsList selectedId={selectedId} onSelect={handleSelectContact} />
				</Grid.Col>

				<Grid.Col h='100%' span={8} visibleFrom='lg'>
					{selectedId ? <ContactDetail contactId={selectedId} /> : null}
				</Grid.Col>
			</Grid>

			{/* Mobile Drawer */}
			<Drawer
				opened={drawerOpened}
				onClose={closeDrawer}
				position='right'
				size='100%'
				hiddenFrom='lg'
				title='Contact Details'
			>
				{selectedId ? <ContactDetail contactId={selectedId} /> : null}
			</Drawer>
		</>
	)
}
