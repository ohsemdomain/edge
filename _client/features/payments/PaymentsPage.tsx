import { Drawer, Grid } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { trpc } from '~c/trpc'
import { PaymentDetail } from './PaymentDetail'
import { PaymentsList } from './PaymentsList'

export function PaymentsPage() {
	const [searchParams, setSearchParams] = useSearchParams()
	const [drawerOpened, { open: openDrawer, close: closeDrawer }] = useDisclosure(false)

	const selectedId = searchParams.get('id') || ''

	const { data } = trpc.payments.list.useQuery({
		search: '',
		page: 1,
		limit: 1000
	})

	// Auto-select first payment if none selected on desktop
	useEffect(() => {
		if (data?.payments.length && !selectedId && window.innerWidth >= 1024) {
			const params = new URLSearchParams(searchParams)
			params.set('id', data.payments[0].id)
			setSearchParams(params)
		}
	}, [data?.payments, selectedId, searchParams, setSearchParams])

	const handleSelectPayment = (id: string) => {
		const params = new URLSearchParams(searchParams)
		params.set('id', id)
		setSearchParams(params)

		// Open drawer on mobile when selecting a payment
		if (window.innerWidth < 1024) {
			openDrawer()
		}
	}

	return (
		<>
			<Grid gutter='md' p='md' style={{ height: '100%', display: 'flex' }}>
				<Grid.Col h='100%' span={{ base: 12, lg: 4 }}>
					<PaymentsList selectedId={selectedId} onSelect={handleSelectPayment} />
				</Grid.Col>

				<Grid.Col h='100%' span={8} visibleFrom='lg'>
					{selectedId ? <PaymentDetail paymentId={selectedId} /> : null}
				</Grid.Col>
			</Grid>

			{/* Mobile Drawer */}
			<Drawer
				opened={drawerOpened}
				onClose={closeDrawer}
				position='right'
				size='100%'
				hiddenFrom='lg'
				title='Payment Details'
			>
				{selectedId ? <PaymentDetail paymentId={selectedId} /> : null}
			</Drawer>
		</>
	)
}