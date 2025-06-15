import { Box, Button, Group, Stack, Switch, Text, TextInput } from '@mantine/core'
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
	const [formData, setFormData] = useState({ 
		company_name: '', 
		person_incharge: '', 
		primary_phone: '', 
		email: '', 
		phone_alt_1: '', 
		phone_alt_2: '', 
		phone_alt_3: '', 
		is_supplier: false 
	})
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
				setFormData({ 
					company_name: contact.company_name, 
					person_incharge: contact.person_incharge, 
					primary_phone: contact.primary_phone, 
					email: contact.email || '', 
					phone_alt_1: contact.phone_alt_1 || '', 
					phone_alt_2: contact.phone_alt_2 || '', 
					phone_alt_3: contact.phone_alt_3 || '', 
					is_supplier: contact.is_supplier 
				})
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
	const canSubmit = formData.company_name && formData.person_incharge && formData.primary_phone && !isLoading

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
							label='Company Name'
							placeholder='Enter company name'
							value={formData.company_name}
							onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
							required
						/>

						<TextInput
							label='Person In Charge'
							placeholder='Enter person in charge'
							value={formData.person_incharge}
							onChange={(e) => setFormData({ ...formData, person_incharge: e.target.value })}
							required
						/>

						<TextInput
							label='Primary Phone'
							placeholder='Enter primary phone'
							value={formData.primary_phone}
							onChange={(e) => setFormData({ ...formData, primary_phone: e.target.value })}
							required
						/>

						<TextInput
							label='Email'
							placeholder='Enter email (optional)'
							type='email'
							value={formData.email}
							onChange={(e) => setFormData({ ...formData, email: e.target.value })}
						/>

						<TextInput
							label='Alternative Phone 1'
							placeholder='Enter alternative phone 1 (optional)'
							value={formData.phone_alt_1}
							onChange={(e) => setFormData({ ...formData, phone_alt_1: e.target.value })}
						/>

						<TextInput
							label='Alternative Phone 2'
							placeholder='Enter alternative phone 2 (optional)'
							value={formData.phone_alt_2}
							onChange={(e) => setFormData({ ...formData, phone_alt_2: e.target.value })}
						/>

						<TextInput
							label='Alternative Phone 3'
							placeholder='Enter alternative phone 3 (optional)'
							value={formData.phone_alt_3}
							onChange={(e) => setFormData({ ...formData, phone_alt_3: e.target.value })}
						/>

						<Switch
							label='Is Supplier'
							description='Toggle on for Supplier, off for Client'
							checked={formData.is_supplier}
							onChange={(e) => setFormData({ ...formData, is_supplier: e.currentTarget.checked })}
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
