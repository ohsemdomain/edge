import { Button, Card, Group, Pagination, Stack, Text, TextInput } from '@mantine/core'
import { useState } from 'react'
import toast from 'react-hot-toast'
import { useSearchParams } from 'react-router-dom'
import { trpc } from '../utils/trpc'

export function ItemsPage() {
	const [searchParams, setSearchParams] = useSearchParams()
	const [newItemName, setNewItemName] = useState('')
	const [editingId, setEditingId] = useState<string | null>(null)
	const [editingName, setEditingName] = useState('')

	// Get state from URL
	const search = searchParams.get('search') || ''
	const page = Number(searchParams.get('page')) || 1

	// Query with URL params
	const { data, refetch } = trpc.items.list.useQuery({
		search,
		page,
		limit: 10
	})

	// Mutations
	const createMutation = trpc.items.create.useMutation({
		onSuccess: () => {
			refetch()
			setNewItemName('')
			toast.success('Item created')
		}
	})

	const updateMutation = trpc.items.update.useMutation({
		onSuccess: () => {
			refetch()
			setEditingId(null)
			toast.success('Item updated')
		}
	})

	const deleteMutation = trpc.items.delete.useMutation({
		onSuccess: () => {
			refetch()
			toast.success('Item deleted')
		}
	})

	// URL state handlers
	const handleSearch = (value: string) => {
		const params = new URLSearchParams(searchParams)
		if (value) {
			params.set('search', value)
			params.set('page', '1') // Reset to page 1 on new search
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
		<Stack>
			{/* Search */}
			<TextInput placeholder='Search items...' value={search} onChange={(e) => handleSearch(e.target.value)} />

			{/* Create */}
			<Group>
				<TextInput
					placeholder='New item name'
					value={newItemName}
					onChange={(e) => setNewItemName(e.target.value)}
					onKeyDown={(e) => {
						if (e.key === 'Enter' && newItemName) {
							createMutation.mutate({ name: newItemName })
						}
					}}
				/>
				<Button onClick={() => createMutation.mutate({ name: newItemName })} disabled={!newItemName || createMutation.isPending}>
					Add Item
				</Button>
			</Group>

			{/* Items List */}
			<Stack>
				{data?.items.map((item) => (
					<Card key={item.id} withBorder>
						<Group justify='space-between'>
							{editingId === item.id ? (
								<TextInput
									value={editingName}
									onChange={(e) => setEditingName(e.target.value)}
									onKeyDown={(e) => {
										if (e.key === 'Enter') {
											updateMutation.mutate({ id: item.id, name: editingName })
										}
										if (e.key === 'Escape') {
											setEditingId(null)
										}
									}}
								/>
							) : (
								<Text>{item.name}</Text>
							)}

							<Group>
								{editingId === item.id ? (
									<>
										<Button onClick={() => updateMutation.mutate({ id: item.id, name: editingName })} disabled={updateMutation.isPending}>
											Save
										</Button>
										<Button variant='subtle' onClick={() => setEditingId(null)}>
											Cancel
										</Button>
									</>
								) : (
									<>
										<Button
											onClick={() => {
												setEditingId(item.id)
												setEditingName(item.name)
											}}
										>
											Edit
										</Button>
										<Button color='red' onClick={() => deleteMutation.mutate(item.id)} disabled={deleteMutation.isPending}>
											Delete
										</Button>
									</>
								)}
							</Group>
						</Group>
					</Card>
				))}
			</Stack>

			{/* Pagination */}
			{data && data.totalPages > 1 && <Pagination value={page} onChange={handlePageChange} total={data.totalPages} />}

			<Text size='sm' c='dimmed'>
				Showing {data?.items.length || 0} of {data?.totalItems || 0} items
			</Text>
		</Stack>
	)
}
