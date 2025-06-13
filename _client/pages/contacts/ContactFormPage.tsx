import { Button, Card, Container, Group, Stack, Text, TextInput, Title } from '@mantine/core'
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { useNavigate, useParams } from 'react-router-dom'
import { trpc } from '../../utils/trpc'

interface ContactFormPageProps {
	mode: 'create' | 'edit'
}

export function ContactFormPage({ mode }: ContactFormPageProps) {
	const navigate = useNavigate()
	const { id: contactId } = useParams()
	const [formData, setFormData] = useState({ name: '', phone: '' })
	const utils = trpc.useUtils()

	// Load contact data for edit mode
	const { data: contactsData } = trpc.contacts.list.useQuery({ search: '', page: 1, limit: 100 }, { enabled: mode === 'edit' })

	useEffect(() => {
		if (mode === 'edit' && contactId && contactsData) {
			const contact = contactsData.contacts.find((c) => c.id === contactId)
			if (contact) {
				setFormData({ name: contact.name, phone: contact.phone })
			}
		}
	}, [mode, contactId, contactsData])

	const createMutation = trpc.contacts.create.useMutation({
		onSuccess: (data) => {
			utils.contacts.list.invalidate()
			toast.success('Contact created')
			navigate(`/contacts?id=${data.id}`)
		}
	})

	const updateMutation = trpc.contacts.update.useMutation({
		onSuccess: () => {
			utils.contacts.list.invalidate()
			toast.success('Contact updated')
			navigate(`/contacts?id=${contactId}`)
		}
	})

	const handleSubmit = () => {
		if (mode === 'create') {
			createMutation.mutate(formData)
		} else if (contactId) {
			updateMutation.mutate({ id: contactId, ...formData })
		}
	}

	const isLoading = createMutation.isPending || updateMutation.isPending
	const canSubmit = formData.name && formData.phone && !isLoading

	return (
		<Container size='sm' mt='xl'>
			<Card padding='lg'>
				<Stack>
					<div>
						<Title order={2}>{mode === 'create' ? 'New Contact' : 'Edit Contact'}</Title>
						<Text c='dimmed' size='sm'>
							{mode === 'create' ? 'Add a new contact' : 'Update contact information'}
						</Text>
					</div>

					<Stack gap='md' mt='xl'>
						<TextInput
							label='Name'
							placeholder='Enter name'
							value={formData.name}
							onChange={(e) => setFormData({ ...formData, name: e.target.value })}
							required
						/>

						<TextInput
							label='Phone'
							placeholder='Enter phone number'
							value={formData.phone}
							onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
							required
						/>
					</Stack>

					<Group mt='xl'>
						<Button onClick={handleSubmit} disabled={!canSubmit} loading={isLoading}>
							{mode === 'create' ? 'Create' : 'Save'}
						</Button>
						<Button variant='subtle' onClick={() => navigate('/contacts')} disabled={isLoading}>
							Cancel
						</Button>
					</Group>
				</Stack>
			</Card>
		</Container>
	)
}
