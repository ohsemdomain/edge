import { Grid } from '@mantine/core'
import { useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { trpc } from '~c/utils/trpc'
import { ItemDetail } from './ItemDetail'
import { ItemsList } from './ItemsList'

export function ItemsPage() {
	const [searchParams, setSearchParams] = useSearchParams()

	const selectedId = searchParams.get('id') || ''
	const search = searchParams.get('search') || ''
	const page = Number(searchParams.get('page')) || 1

	const { data } = trpc.items.list.useQuery({ search, page, limit: 10 })

	// Auto-select first item if none selected	
	useEffect(() => {
		if (data?.items.length && !selectedId) {
			const params = new URLSearchParams(searchParams)
			params.set('id', data.items[0].id)
			setSearchParams(params)
		}
	}, [data?.items, selectedId])

	const handleSelectItem = (id: string) => {
		const params = new URLSearchParams(searchParams)
		params.set('id', id)
		setSearchParams(params)
	}

	return (
		<Grid gutter='md' h='calc(100vh - 120px)'>
			<Grid.Col span={4} h='100%' style={{ overflow: 'hidden' }}>
				<ItemsList selectedId={selectedId} onSelect={handleSelectItem} />
			</Grid.Col>

			<Grid.Col span={8} h='100%' style={{ overflow: 'hidden' }}>
				{selectedId ? <ItemDetail itemId={selectedId} /> : null}
			</Grid.Col>
		</Grid>
	)
}