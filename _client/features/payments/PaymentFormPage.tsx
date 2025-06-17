//_client/features/payments/PaymentFormPage.tsx
import { Box, Button, Group, NumberInput, Select, Stack, Text, Textarea } from '@mantine/core'
import { DateInput } from '@mantine/dates'
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { useNavigate, useParams } from 'react-router-dom'
import { trpc } from '~c/trpc'

interface PaymentFormPageProps {
	mode: 'create' | 'edit'
}

export function PaymentFormPage({ mode }: PaymentFormPageProps) {
	const navigate = useNavigate()
	const { id: paymentId } = useParams()
	const [formData, setFormData] = useState({
		contactId: '',
		invoiceId: '',
		amount: 0,
		paymentDate: new Date(),
		paymentMethod: '',
		type: 'payment' as 'payment' | 'refund',
		notes: ''
	})
	const utils = trpc.useUtils()

	// Load contacts for dropdown
	const { data: contactsData } = trpc.contacts.list.useQuery({
		search: '',
		page: 1,
		limit: 1000,
		isActive: true
	})

	// Load invoices for dropdown (optional)
	const { data: invoicesData } = trpc.invoices.list.useQuery({
		search: '',
		page: 1,
		limit: 1000,
		isActive: true
	})

	// Load payment data for edit mode
	const { data: paymentData } = trpc.payments.getById.useQuery(
		{ id: paymentId! },
		{ enabled: mode === 'edit' && !!paymentId }
	)

	useEffect(() => {
		if (mode === 'edit' && paymentData) {
			setFormData({
				contactId: paymentData.contact_id as string,
				invoiceId: paymentData.invoice_id as string || '',
				amount: paymentData.amount as number,
				paymentDate: new Date((paymentData.paymentDate as number) * 1000),
				paymentMethod: paymentData.paymentMethod as string || '',
				type: (paymentData.type as 'payment' | 'refund') || 'payment',
				notes: paymentData.notes as string || ''
			})
		}
	}, [mode, paymentData])

	const createMutation = trpc.payments.create.useMutation({
		onSuccess: (data) => {
			utils.payments.list.invalidate()
			navigate(`/payments?id=${data.id}`)
		}
	})

	const updateMutation = trpc.payments.update.useMutation({
		onSuccess: () => {
			utils.payments.list.invalidate()
			navigate(`/payments?id=${paymentId}`)
		}
	})

	const handleSubmit = () => {
		const submitData = {
			...formData,
			paymentDate: formData.paymentDate.toISOString(),
			invoiceId: formData.invoiceId || undefined
		}

		if (mode === 'create') {
			toast.promise(createMutation.mutateAsync(submitData), {
				loading: 'Saving...',
				success: 'Payment created',
				error: 'Could not save'
			})
		} else if (paymentId) {
			toast.promise(updateMutation.mutateAsync({ id: paymentId, ...submitData }), {
				loading: 'Saving...',
				success: 'Payment updated',
				error: 'Could not save'
			})
		}
	}

	const isLoading = createMutation.isPending || updateMutation.isPending
	const canSubmit = formData.contactId && formData.amount > 0 && !isLoading

	// Prepare options for dropdowns
	const contactOptions = contactsData?.contacts.map(contact => ({
		value: contact.id,
		label: contact.company_name
	})) || []

	const invoiceOptions = invoicesData?.invoices.map(invoice => ({
		value: invoice.id,
		label: `${invoice.invoice_number} - ${invoice.contact_name}`
	})) || []

	const paymentMethodOptions = [
		{ value: 'cash', label: 'Cash' },
		{ value: 'check', label: 'Check' },
		{ value: 'bank_transfer', label: 'Bank Transfer' },
		{ value: 'credit_card', label: 'Credit Card' },
		{ value: 'online', label: 'Online Payment' },
		{ value: 'other', label: 'Other' }
	]

	const typeOptions = [
		{ value: 'payment', label: 'Payment' },
		{ value: 'refund', label: 'Refund' }
	]

	return (
		<Stack h='100%' gap={0} justify='start' align='center' mt='lg'>
			<Box maw={800} w='100%' p='md' style={{ overflow: 'hidden' }}>
				<Group justify='space-between' align='center'>
					<Text size='xl' fw={600}>
						{mode === 'create' ? 'Create Payment' : 'Edit Payment'}
					</Text>
				</Group>
				<Stack mt='xl'>
					<Stack gap='md'>
						<Select
							label='Contact'
							placeholder='Select contact'
							data={contactOptions}
							value={formData.contactId}
							onChange={(value) => setFormData({ ...formData, contactId: value || '' })}
							searchable
							required
						/>
						<Select
							label='Invoice (Optional)'
							placeholder='Select invoice'
							data={invoiceOptions}
							value={formData.invoiceId}
							onChange={(value) => setFormData({ ...formData, invoiceId: value || '' })}
							searchable
							clearable
						/>
						<NumberInput
							label='Amount'
							placeholder='Enter amount'
							value={formData.amount}
							onChange={(value) =>
								setFormData({ ...formData, amount: typeof value === 'number' ? value : 0 })
							}
							min={0}
							decimalScale={2}
							hideControls
							onFocus={(e) => e.target.select()}
							required
						/>
						<DateInput
							label='Payment Date'
							placeholder='Select payment date'
							value={formData.paymentDate}
							onChange={(value) =>
								setFormData({ ...formData, paymentDate: value ? new Date(value) : new Date() })
							}
							required
						/>
						<Select
							label='Payment Method'
							placeholder='Select payment method'
							data={paymentMethodOptions}
							value={formData.paymentMethod}
							onChange={(value) => setFormData({ ...formData, paymentMethod: value || '' })}
						/>
						<Select
							label='Type'
							data={typeOptions}
							value={formData.type}
							onChange={(value) => setFormData({ ...formData, type: (value as 'payment' | 'refund') || 'payment' })}
							required
						/>
						<Textarea
							label='Notes (Optional)'
							placeholder='Enter payment notes'
							value={formData.notes}
							onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
							rows={3}
						/>
					</Stack>
					<Group mt='xl'>
						<Button onClick={handleSubmit} disabled={!canSubmit}>
							{mode === 'create' ? 'Create' : 'Save'}
						</Button>
						<Button variant='subtle' onClick={() => navigate('/payments')} disabled={isLoading}>
							Cancel
						</Button>
					</Group>
				</Stack>
			</Box>
		</Stack>
	)
}