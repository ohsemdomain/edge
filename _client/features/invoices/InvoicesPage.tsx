import { Drawer, Grid } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { trpc } from '~c/trpc'
import { InvoiceDetail } from './InvoiceDetail'
import { InvoicesList } from './InvoicesList'

export function InvoicesPage() {
	const [searchParams, setSearchParams] = useSearchParams()
	const [drawerOpened, { open: openDrawer, close: closeDrawer }] = useDisclosure(false)

	const selectedId = searchParams.get('id') || ''

	const { data } = trpc.invoices.list.useQuery({
		search: '',
		page: 1,
		limit: 1000,
		isActive: true
	})

	// Auto-select first invoice if none selected on desktop
	useEffect(() => {
		if (data?.invoices.length && !selectedId && window.innerWidth >= 1024) {
			const params = new URLSearchParams(searchParams)
			params.set('id', data.invoices[0].id)
			setSearchParams(params)
		}
	}, [data?.invoices, selectedId, searchParams, setSearchParams])

	const handleSelectInvoice = (id: string) => {
		const params = new URLSearchParams(searchParams)
		params.set('id', id)
		setSearchParams(params)

		// Open drawer on mobile when selecting an invoice
		if (window.innerWidth < 1024) {
			openDrawer()
		}
	}

	return (
		<>
			<Grid gutter='md' p='md' style={{ height: '100%', display: 'flex' }}>
				<Grid.Col h='100%' span={{ base: 12, lg: 4 }}>
					<InvoicesList selectedId={selectedId} onSelect={handleSelectInvoice} />
				</Grid.Col>

				<Grid.Col h='100%' span={8} visibleFrom='lg'>
					{selectedId ? <InvoiceDetail invoiceId={selectedId} /> : null}
				</Grid.Col>
			</Grid>

			{/* Mobile Drawer */}
			<Drawer
				opened={drawerOpened}
				onClose={closeDrawer}
				position='right'
				size='100%'
				hiddenFrom='lg'
				title='Invoice Details'
			>
				{selectedId ? <InvoiceDetail invoiceId={selectedId} /> : null}
			</Drawer>
		</>
	)
}