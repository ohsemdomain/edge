// _client/features/invoices/PaymentModal.tsx
import { Button, Group, Modal, NumberInput, Stack, Textarea, Select } from '@mantine/core'
import { DateInput } from '@mantine/dates'
import { useState } from 'react'
import toast from 'react-hot-toast'
import { trpc } from '~c/trpc'

interface PaymentModalProps {
	opened: boolean
	onClose: () => void
	contactId: string
	invoiceId?: string
	onSuccess: () => void
}

export function PaymentModal({ opened, onClose, contactId, invoiceId, onSuccess }: PaymentModalProps) {
	const [amount, setAmount] = useState<number | string>('')
	const [paymentDate, setPaymentDate] = useState<Date | null>(new Date())
	const [paymentMethod, setPaymentMethod] = useState('')
	const [notes, setNotes] = useState('')

	const createPaymentMutation = trpc.payments.create.useMutation()

	// Payment method options
	const paymentMethodOptions = [
		{ value: 'cash', label: 'Cash' },
		{ value: 'check', label: 'Check' },
		{ value: 'bank_transfer', label: 'Bank Transfer' },
		{ value: 'credit_card', label: 'Credit Card' },
		{ value: 'online', label: 'Online Payment' },
		{ value: 'other', label: 'Other' }
	]

	const handleSubmit = async () => {
		if (!amount || !paymentDate) {
			toast.error('Please fill in required fields')
			return
		}

		const amountNum = typeof amount === 'string' ? parseFloat(amount) : amount
		if (isNaN(amountNum) || amountNum <= 0) {
			toast.error('Please enter a valid amount')
			return
		}

		try {
			await toast.promise(
				createPaymentMutation.mutateAsync({
					contactId,
					invoiceId,
					amount: amountNum,
					paymentDate: Math.floor(paymentDate.getTime() / 1000), // Convert to Unix timestamp
					paymentMethod: paymentMethod || undefined,
					notes: notes || undefined
				}),
				{
					loading: 'Recording payment...',
					success: 'Payment recorded successfully',
					error: 'Failed to record payment'
				}
			)

			// Reset form
			setAmount('')
			setPaymentDate(new Date())
			setPaymentMethod('')
			setNotes('')
			
			onSuccess()
		} catch (error) {
			console.error('Failed to record payment:', error)
		}
	}

	const handleClose = () => {
		// Reset form on close
		setAmount('')
		setPaymentDate(new Date())
		setPaymentMethod('')
		setNotes('')
		onClose()
	}

	return (
		<Modal
			opened={opened}
			onClose={handleClose}
			title='Record Payment'
			size='md'
		>
			<Stack gap='md'>
				<NumberInput
					label='Payment Amount'
					placeholder='0.00'
					value={amount}
					onChange={setAmount}
					min={0}
					decimalScale={2}
					fixedDecimalScale
					prefix='RM'
					required
				/>

				<DateInput
					label='Payment Date'
					value={paymentDate}
					onChange={(date) => setPaymentDate(date && typeof date === 'object' ? date as Date : (date ? new Date(date) : null))}
					valueFormat="DD.MM.YYYY"
					dateParser={(input) => {
						// Parse custom format DD.MM.YYYY
						const [day, month, year] = input.split('.')
						if (day && month && year) {
							return new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
						}
						return new Date(input)
					}}
					required
				/>

				<Select
					label='Payment Method'
					placeholder='Select payment method'
					data={paymentMethodOptions}
					value={paymentMethod}
					onChange={(value) => setPaymentMethod(value || '')}
				/>

				<Textarea
					label='Notes'
					placeholder='Optional notes about this payment'
					value={notes}
					onChange={(e) => setNotes(e.target.value)}
					rows={3}
				/>

				<Group justify='flex-end' gap='sm'>
					<Button
						variant='outline'
						onClick={handleClose}
					>
						Cancel
					</Button>
					<Button
						onClick={handleSubmit}
						loading={createPaymentMutation.isPending}
						disabled={!amount || !paymentDate}
					>
						Record Payment
					</Button>
				</Group>
			</Stack>
		</Modal>
	)
}