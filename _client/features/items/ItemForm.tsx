import { Button, Card, Group, Stack, Text, TextInput, Title } from '@mantine/core'
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { trpc } from '~c/utils/trpc'

interface ItemFormProps {
	mode: 'create' | 'edit'
	itemId?: string
	onComplete: (itemId?: string) => void
	onCancel: () => void
}

export function ItemForm({ mode, itemId, onComplete, onCancel }: ItemFormProps) {
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
			onComplete(data.id)
		}
	})

	const updateMutation = trpc.items.update.useMutation({
		onSuccess: () => {
			utils.items.list.invalidate()
			toast.success('Item updated')
			onComplete(itemId)
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
		<Card h='100%' padding='lg'>
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
					<Button variant='subtle' onClick={onCancel} disabled={isLoading}>
						Cancel
					</Button>
				</Group>
			</Stack>
		</Card>
	)
}