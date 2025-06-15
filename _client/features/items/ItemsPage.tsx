import { Drawer, Grid } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { trpc } from '~c/trpc'
import { ItemDetail } from './ItemDetail'
import { ItemsList } from './ItemsList'

export function ItemsPage() {
	const [searchParams, setSearchParams] = useSearchParams()
	const [drawerOpened, { open: openDrawer, close: closeDrawer }] = useDisclosure(false)

	const selectedId = searchParams.get('id') || ''

	const { data } = trpc.items.list.useQuery({
		search: '',
		page: 1,
		limit: 1000,
		isActive: true
	})

	// Auto-select first item if none selected on desktop
	useEffect(() => {
		if (data?.items.length && !selectedId && window.innerWidth >= 1024) {
			const params = new URLSearchParams(searchParams)
			params.set('id', data.items[0].id)
			setSearchParams(params)
		}
	}, [data?.items, selectedId, searchParams, setSearchParams])

	const handleSelectItem = (id: string) => {
		const params = new URLSearchParams(searchParams)
		params.set('id', id)
		setSearchParams(params)

		// Open drawer on mobile when selecting an item
		if (window.innerWidth < 1024) {
			openDrawer()
		}
	}

	return (
		<>
			<Grid gutter='md' p='md' style={{ height: '100%', display: 'flex' }}>
				<Grid.Col h='100%' span={{ base: 12, lg: 4 }}>
					<ItemsList selectedId={selectedId} onSelect={handleSelectItem} />
				</Grid.Col>

				<Grid.Col h='100%' span={8} visibleFrom='lg'>
					{selectedId ? <ItemDetail itemId={selectedId} /> : null}
				</Grid.Col>
			</Grid>

			{/* Mobile Drawer */}
			<Drawer
				opened={drawerOpened}
				onClose={closeDrawer}
				position='right'
				size='100%'
				hiddenFrom='lg'
				title='Item Details'
			>
				{selectedId ? <ItemDetail itemId={selectedId} /> : null}
			</Drawer>
		</>
	)
}
