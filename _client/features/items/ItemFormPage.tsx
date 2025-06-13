import { Button, Card, Container, Group, Stack, Text, TextInput, Title } from '@mantine/core'
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { useNavigate, useParams } from 'react-router-dom'
import { trpc } from '~c/utils/trpc'

interface ItemFormPageProps {
	mode: 'create' | 'edit'
}

export function ItemFormPage({ mode }: ItemFormPageProps) {
	const navigate = useNavigate()
	const { id: itemId } = useParams()
	const [formData, setFormData] = useState({ name: '' })
	const utils = trpc.useUtils()

	// Load item data for edit mode
	const { data: itemsData } = trpc.items.list.useQuery({ search: '', page: 1, limit: 100 }, { enabled: mode === 'edit' })

	useEffect(() => {
		if (mode === 'edit' && itemId && itemsData) {
			const item = itemsData.items.find((i) => i.id === itemId)
			if (item) {
				setFormData({ name: item.name })
			}
		}
	}, [mode, itemId, itemsData])

	const createMutation = trpc.items.create.useMutation({
		onSuccess: (data) => {
			utils.items.list.invalidate()
			toast.success('Item created')
			navigate(`/items?id=${data.id}`)
		}
	})

	const updateMutation = trpc.items.update.useMutation({
		onSuccess: () => {
			utils.items.list.invalidate()
			toast.success('Item updated')
			navigate(`/items?id=${itemId}`)
		}
	})

	const handleSubmit = () => {
		if (mode === 'create') {
			createMutation.mutate(formData)
		} else if (itemId) {
			updateMutation.mutate({ id: itemId, ...formData })
		}
	}

	const isLoading = createMutation.isPending || updateMutation.isPending
	const canSubmit = formData.name && !isLoading

	return (
		<Container size='sm' mt='xl'>
			<Card padding='lg'>
				<Stack>
					<div>
						<Title order={2}>{mode === 'create' ? 'New Item' : 'Edit Item'}</Title>
						<Text c='dimmed' size='sm'>
							{mode === 'create' ? 'Add a new item' : 'Update item information'}
						</Text>
					</div>

					<Stack gap='md' mt='xl'>
						<TextInput
							label='Name'
							placeholder='Enter item name'
							value={formData.name}
							onChange={(e) => setFormData({ ...formData, name: e.target.value })}
							required
						/>
					</Stack>

					<Group mt='xl'>
						<Button onClick={handleSubmit} disabled={!canSubmit} loading={isLoading}>
							{mode === 'create' ? 'Create' : 'Save'}
						</Button>
						<Button variant='subtle' onClick={() => navigate('/items')} disabled={isLoading}>
							Cancel
						</Button>
					</Group>
				</Stack>
			</Card>
		</Container>
	)
}