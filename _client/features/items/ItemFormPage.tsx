import { Box, Button, Group, Stack, TextInput, Title } from '@mantine/core'
import { MoveLeft } from 'lucide-react'
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
		<Stack h='100%' gap={0} justify='start' align='center' mt='lg'>
			<Box maw={800} w='100%' p='md' style={{ overflow: 'hidden' }}>
				<Group bg='gray.0' justify='space-between' align='center'>
					<div>
						<Title order={2}>{mode === 'create' ? 'New Item' : 'Edit Item'}</Title>
					</div>
					<Group>
						<Button
							leftSection={<MoveLeft size={16} />}
							onClick={() => navigate('/items')}
							disabled={isLoading}
						>
							Back
						</Button>
					</Group>
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
