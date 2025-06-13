import { Drawer, Grid } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { trpc } from '~c/utils/trpc'
import { ContactDetail } from './ContactDetail'
import { ContactsList } from './ContactsList'

export function ContactsPage() {
	const [searchParams, setSearchParams] = useSearchParams()
	const [drawerOpened, { open: openDrawer, close: closeDrawer }] = useDisclosure(false)

	const selectedId = searchParams.get('id') || ''
	const search = searchParams.get('search') || ''
	const page = Number(searchParams.get('page')) || 1

	const { data } = trpc.contacts.list.useQuery({ search, page, limit: 10 })

	// Auto-select first contact if none selected on desktop	
	useEffect(() => {
		if (data?.contacts.length && !selectedId && window.innerWidth >= 1024) {
			const params = new URLSearchParams(searchParams)
			params.set('id', data.contacts[0].id)
			setSearchParams(params)
		}
	}, [data?.contacts, selectedId])

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
			<Grid gutter='md'>
				<Grid.Col span={{ base: 12, lg: 4 }}>
					<ContactsList selectedId={selectedId} onSelect={handleSelectContact} />
				</Grid.Col>

				<Grid.Col span={8} visibleFrom='lg'>
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
