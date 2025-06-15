import { Box, Button, Group, Stack, Text, TextInput } from '@mantine/core'
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { useNavigate, useParams } from 'react-router-dom'
import { trpc } from '~c/trpc'

interface ContactFormPageProps {
	mode: 'create' | 'edit'
}

export function ContactFormPage({ mode }: ContactFormPageProps) {
	const navigate = useNavigate()
	const { id: contactId } = useParams()
	const [formData, setFormData] = useState({ legal_name: '', contact_type: 'client' })
	const utils = trpc.useUtils()

	// Use cached data from ContactsList query for edit mode
	const { data: contactsData } = trpc.contacts.list.useQuery(
		{ search: '', page: 1, limit: 1000, isActive: true },
		{ enabled: mode === 'edit' }
	)

	useEffect(() => {
		if (mode === 'edit' && contactId && contactsData) {
			const contact = contactsData.contacts.find((c) => c.id === contactId)
			if (contact) {
				setFormData({ legal_name: contact.legal_name, contact_type: contact.contact_type })
			}
		}
	}, [mode, contactId, contactsData])

	const createMutation = trpc.contacts.create.useMutation({
		onSuccess: (data) => {
			utils.contacts.list.invalidate()
			navigate(`/contacts?id=${data.id}`)
		}
	})

	const updateMutation = trpc.contacts.update.useMutation({
		onSuccess: () => {
			utils.contacts.list.invalidate()
			navigate(`/contacts?id=${contactId}`)
		}
	})

	const handleSubmit = () => {
		if (mode === 'create') {
			toast.promise(createMutation.mutateAsync(formData), {
				loading: 'Saving...',
				success: 'Contact created',
				error: 'Could not save'
			})
		} else if (contactId) {
			toast.promise(updateMutation.mutateAsync({ id: contactId, ...formData }), {
				loading: 'Saving...',
				success: 'Contact updated',
				error: 'Could not save'
			})
		}
	}

	const isLoading = createMutation.isPending || updateMutation.isPending
	const canSubmit = formData.legal_name && formData.contact_type && !isLoading

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
							label='Legal Name'
							placeholder='Enter legal name'
							value={formData.legal_name}
							onChange={(e) => setFormData({ ...formData, legal_name: e.target.value })}
							required
						/>

						<TextInput
							label='Contact Type'
							placeholder='Enter contact type (client, supplier, employee)'
							value={formData.contact_type}
							onChange={(e) => setFormData({ ...formData, contact_type: e.target.value })}
							required
						/>
					</Stack>
					<Group mt='xl'>
						<Button onClick={handleSubmit} disabled={!canSubmit}>
							{mode === 'create' ? 'Create' : 'Save'}
						</Button>
						<Button variant='subtle' onClick={() => navigate('/contacts')} disabled={isLoading}>
							Cancel
						</Button>
					</Group>
				</Stack>
			</Box>
		</Stack>
	)
}
