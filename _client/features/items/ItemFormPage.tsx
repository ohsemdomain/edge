//_client/features/items/ItemFormPage.tsx
import { Box, Button, Group, NumberInput, Stack, TextInput, Textarea } from '@mantine/core'
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { useNavigate, useParams } from 'react-router-dom'
import { trpc } from '~c/trpc'
import type { ItemCreateInput } from '~/items/api'

interface ItemFormPageProps {
	mode: 'create' | 'edit'
}

export function ItemFormPage({ mode }: ItemFormPageProps) {
	const navigate = useNavigate()
	const { id: itemId } = useParams()
	const [formData, setFormData] = useState<ItemCreateInput>({ name: '', description: '', unitPrice: 0 })
	const utils = trpc.useUtils()

	// Use cached data from ItemsList query for edit mode
	const { data: itemsData } = trpc.items.list.useQuery(
		{ search: '', page: 1, limit: 1000 },
		{ enabled: mode === 'edit' }
	)

	useEffect(() => {
		if (mode === 'edit' && itemId && itemsData) {
			const item = itemsData.items.find((i) => i.id === itemId)
			if (item) {
				setFormData({ name: item.name, description: item.description, unitPrice: item.unitPrice })
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
	const canSubmit = formData.name && formData.description && formData.unitPrice > 0 && !isLoading

	return (
		<Stack h='100%' gap={0} justify='start' align='center' mt='lg'>
			<Box maw={800} w='100%' p='md' style={{ overflow: 'hidden' }}>
				<Stack mt='xl'>
					<Stack gap='md'>
						<TextInput
							label='Name'
							placeholder='Enter item name'
							value={formData.name}
							onChange={(e) => setFormData({ ...formData, name: e.target.value })}
							required
						/>
						<Textarea
							label='Description'
							placeholder='Enter item description'
							value={formData.description}
							onChange={(e) => setFormData({ ...formData, description: e.target.value })}
							rows={5}
							required
						/>
						<NumberInput
							label='Unit Price'
							placeholder='Enter unit price'
							value={formData.unitPrice}
							onChange={(value) =>
								setFormData({ ...formData, unitPrice: typeof value === 'number' ? value : 0 })
							}
							min={0}
							decimalScale={2}
							hideControls
							onFocus={(e) => e.target.select()}
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
