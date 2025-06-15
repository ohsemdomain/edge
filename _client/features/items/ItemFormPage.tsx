//_client/features/items/ItemFormPage.tsx
import { Box, Button, Group, NumberInput, Stack, Text, TextInput } from '@mantine/core'
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { useNavigate, useParams } from 'react-router-dom'
import { trpc } from '~c/trpc'

interface ItemFormPageProps {
	mode: 'create' | 'edit'
}

export function ItemFormPage({ mode }: ItemFormPageProps) {
	const navigate = useNavigate()
	const { id: itemId } = useParams()
	const [formData, setFormData] = useState({ name: '', description: '', unit_price: 0 })
	const utils = trpc.useUtils()

	// Use cached data from ItemsList query for edit mode
	const { data: itemsData } = trpc.items.list.useQuery(
		{ search: '', page: 1, limit: 1000, isActive: true },
		{ enabled: mode === 'edit' }
	)

	useEffect(() => {
		if (mode === 'edit' && itemId && itemsData) {
			const item = itemsData.items.find((i) => i.id === itemId)
			if (item) {
				setFormData({ name: item.name, description: item.description, unit_price: item.unit_price })
			}
		}
	}, [mode, itemId, itemsData])

	const createMutation = trpc.items.create.useMutation({
		onSuccess: (data) => {
			utils.items.list.invalidate()
			navigate(`/items?id=${data.id}`)
		}
	})

	const updateMutation = trpc.items.update.useMutation({
		onSuccess: () => {
			utils.items.list.invalidate()
			navigate(`/items?id=${itemId}`)
		}
	})

	const handleSubmit = () => {
		if (mode === 'create') {
			toast.promise(createMutation.mutateAsync(formData), {
				loading: 'Saving...',
				success: 'Item created',
				error: 'Could not save'
			})
		} else if (itemId) {
			toast.promise(updateMutation.mutateAsync({ id: itemId, ...formData }), {
				loading: 'Saving...',
				success: 'Item updated',
				error: 'Could not save'
			})
		}
	}

	const isLoading = createMutation.isPending || updateMutation.isPending
	const canSubmit = formData.name && formData.description && formData.unit_price > 0 && !isLoading

	return (
		<Stack h='100%' gap={0} justify='start' align='center' mt='lg'>
			<Box maw={800} w='100%' p='md' style={{ overflow: 'hidden' }}>
				<Group justify='space-between' align='center'>
					<Text>Placholder</Text>
					<Text>Placholder</Text>
				</Group>
				<Stack mt='xl'>
					<Stack gap='md'>
						<TextInput
							label='Name'
							placeholder='Enter item name'
							value={formData.name}
							onChange={(e) => setFormData({ ...formData, name: e.target.value })}
							required
						/>
						<TextInput
							label='Description'
							placeholder='Enter item description'
							value={formData.description}
							onChange={(e) => setFormData({ ...formData, description: e.target.value })}
							required
						/>
						<NumberInput
							label='Unit Price'
							placeholder='Enter unit price'
							value={formData.unit_price}
							onChange={(value) => setFormData({ ...formData, unit_price: typeof value === 'number' ? value : 0 })}
							min={0}
							decimalScale={2}
							fixedDecimalScale
							required
						/>
					</Stack>
					<Group mt='xl'>
						<Button onClick={handleSubmit} disabled={!canSubmit}>
							{mode === 'create' ? 'Create' : 'Save'}
						</Button>
						<Button variant='subtle' onClick={() => navigate('/items')} disabled={isLoading}>
							Cancel
						</Button>
					</Group>
				</Stack>
			</Box>
		</Stack>
	)
}
