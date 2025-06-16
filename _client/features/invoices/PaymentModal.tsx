// _client/features/invoices/PaymentModal.tsx
import { Button, Group, Modal, NumberInput, Stack, Textarea, TextInput } from '@mantine/core'
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

	const createPaymentMutation = trpc.invoices.createPayment.useMutation()

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
					paymentDate: paymentDate.toISOString(),
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
					prefix='$'
					required
				/>

				<DateInput
					label='Payment Date'
					value={paymentDate}
					onChange={(date) => setPaymentDate(date && typeof date === 'object' ? date as Date : (date ? new Date(date) : null))}
					required
				/>

				<TextInput
					label='Payment Method'
					placeholder='e.g., Check, Credit Card, Bank Transfer'
					value={paymentMethod}
					onChange={(e) => setPaymentMethod(e.target.value)}
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