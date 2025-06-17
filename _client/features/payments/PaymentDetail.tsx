// _client/features/payments/PaymentDetail.tsx
import { Badge, Button, Card, Group, Paper, ScrollArea, Stack, Text, Title } from '@mantine/core'
import { Edit, Trash2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { formatCurrency, formatUnixTimestamp } from '~c/lib/formatter'
import { trpc } from '~c/trpc'

interface PaymentDetailProps {
	paymentId: string
}

export function PaymentDetail({ paymentId }: PaymentDetailProps) {
	const navigate = useNavigate()
	const utils = trpc.useUtils()
	const { data: payment } = trpc.payments.getById.useQuery(paymentId)

	const deleteMutation = trpc.payments.delete.useMutation({
		onSuccess: () => {
			toast.success('Payment deleted successfully')
			utils.payments.list.invalidate()
			navigate('/payments')
		},
		onError: (error) => {
			toast.error(error.message || 'Failed to delete payment')
		}
	})

	const handleDelete = () => {
		if (window.confirm('Are you sure you want to delete this payment? This action cannot be undone.')) {
			deleteMutation.mutate(paymentId)
		}
	}

	const getStatusBadge = (type: string) => {
		const colors = {
			payment: 'green',
			refund: 'red'
		}
		return colors[type as keyof typeof colors] || 'gray'
	}

	if (!payment) return null

	return (
		<Paper h='100%' withBorder style={{ overflow: 'hidden' }}>
			<Stack h='100%' gap={0}>
				<Group
					bg='gray.0'
					p='md'
					px={{ base: 'md', lg: 'xl' }}
					justify='space-between'
					align='center'
					className='border-b border-gray-200'
				>
					<div>
						<Title order={2}>
							{payment.contactName}
						</Title>
						<Text c='dimmed' size='sm'>
							Payment Details
						</Text>
					</div>
					<Group>
						<Button
							leftSection={<Edit size={16} />}
							onClick={() => navigate(`/payments/edit/${payment.id}`)}
						>
							Edit
						</Button>
						<Button
							color="red"
							variant="light"
							leftSection={<Trash2 size={16} />}
							onClick={handleDelete}
						>
							Delete
						</Button>
					</Group>
				</Group>

				<ScrollArea flex={1}>
					<Stack p={{ base: 'md', lg: 'xl' }} gap='lg'>
						{/* Payment Summary */}
						<Card withBorder>
							<Group justify='space-between' mb='md'>
								<Text fw={600}>Payment Summary</Text>
								<Badge
									color={getStatusBadge(payment.type)}
									size='lg'
									variant='light'
								>
									{payment.type.toUpperCase()}
								</Badge>
							</Group>
							<Group justify='space-between'>
								<div>
									<Text size='sm' c='dimmed'>Amount</Text>
									<Text size='xl' fw={700}>{formatCurrency(payment.amount)}</Text>
								</div>
								<div style={{ textAlign: 'right' }}>
									<Text size='sm' c='dimmed'>Payment Date</Text>
									<Text size='lg' fw={600}>
										{formatUnixTimestamp(payment.paymentDate)}
									</Text>
								</div>
							</Group>
						</Card>

						{/* Contact Information */}
						<div>
							<Text size='sm' c='dimmed' mb='xs'>Contact</Text>
							<Card withBorder p='sm'>
								<Text fw={500}>{payment.contactName}</Text>
								{payment.contactEmail && (
									<Text size='sm' c='dimmed'>{payment.contactEmail}</Text>
								)}
								{payment.contactPhone && (
									<Text size='sm' c='dimmed'>{payment.contactPhone}</Text>
								)}
							</Card>
						</div>

						{/* Invoice Information */}
						{payment.invoiceNumber && (
							<div>
								<Text size='sm' c='dimmed' mb='xs'>Invoice</Text>
								<Card withBorder p='sm'>
									<Text fw={500}>{payment.invoiceNumber}</Text>
								</Card>
							</div>
						)}

						{/* Payment Details */}
						<Group grow>
							<div>
								<Text size='sm' c='dimmed'>Payment Method</Text>
								<Text fw={500}>{payment.paymentMethod || 'Not specified'}</Text>
							</div>
							<div>
								<Text size='sm' c='dimmed'>Payment Type</Text>
								<Text fw={500}>{payment.type}</Text>
							</div>
						</Group>

						{/* Notes */}
						{payment.notes && (
							<div>
								<Text size='sm' c='dimmed' mb='xs'>Notes</Text>
								<Card withBorder p='sm'>
									<Text size='sm'>{payment.notes}</Text>
								</Card>
							</div>
						)}

						{/* Metadata */}
						<div>
							<Text size='sm' c='dimmed' mb='xs'>Payment ID</Text>
							<Text className='geist' size='sm'>{payment.id}</Text>
						</div>

						<div>
							<Text size='sm' c='dimmed' mb='xs'>Created</Text>
							<Text className='geist' size='sm'>{formatUnixTimestamp(payment.createdAt)}</Text>
						</div>
					</Stack>
				</ScrollArea>
			</Stack>
		</Paper>
	)
}