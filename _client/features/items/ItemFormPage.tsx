//_client/features/items/ItemFormPage.tsx
import { Box, Button, Group, Stack, Text, TextInput } from '@mantine/core'
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
	const { data: itemsData } = trpc.items.list.useQuery(
		{ search: '', page: 1, limit: 100 },
		{ enabled: mode === 'edit' }
	)

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
	const canSubmit = formData.name && !isLoading

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
			</Box>
		</Stack>
	)
}
