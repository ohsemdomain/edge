// _client/features/payments/PaymentDetail.tsx
import { Badge, Button, Card, Group, Paper, ScrollArea, Stack, Text, Title } from '@mantine/core'
import { Archive, Edit } from 'lucide-react'
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

	const { data: payment } = trpc.payments.getById.useQuery({ id: paymentId })

	const toggleActiveMutation = trpc.payments.toggleActive.useMutation({
		onSuccess: () => {
			navigate('/payments')
			utils.payments.list.invalidate()
		}
	})

	const handleToggleActive = (id: string, currentlyActive: boolean) => {
		const action = currentlyActive ? 'Archiving' : 'Restoring'
		const actionPast = currentlyActive ? 'archived' : 'restored'

		toast.promise(toggleActiveMutation.mutateAsync({ id }), {
			loading: `${action}...`,
			success: `Successfully ${actionPast}`,
			error: `Could not ${action.toLowerCase()}`
		})
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
							{payment.contact_name as string}
						</Title>
						<Text c='dimmed' size='sm'>
							Payment Details
						</Text>
					</div>
					<Group>
						<Button
							leftSection={<Edit size={16} />}
							onClick={() => navigate(`/payments/edit/${payment.id as string}`)}
						>
							Edit
						</Button>
						<Button
							bg='gray.1'
							c='dimmed'
							leftSection={<Archive size={16} />}
							onClick={() => {
								if (window.confirm('Move this payment to archive?')) {
									handleToggleActive(payment.id as string, payment.is_active as boolean)
								}
							}}
							disabled={toggleActiveMutation.isPending}
						>
							Archive
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
									color={getStatusBadge(payment.type as string)}
									size='lg'
									variant='light'
								>
									{(payment.type as string).toUpperCase()}
								</Badge>
							</Group>
							<Group justify='space-between'>
								<div>
									<Text size='sm' c='dimmed'>Amount</Text>
									<Text size='xl' fw={700}>{formatCurrency(payment.amount as number)}</Text>
								</div>
								<div style={{ textAlign: 'right' }}>
									<Text size='sm' c='dimmed'>Payment Date</Text>
									<Text size='lg' fw={600}>
										{formatUnixTimestamp(payment.paymentDate as number)}
									</Text>
								</div>
							</Group>
						</Card>

						{/* Contact Information */}
						<div>
							<Text size='sm' c='dimmed' mb='xs'>Contact</Text>
							<Card withBorder p='sm'>
								<Text fw={500}>{payment.contact_name as string}</Text>
								{(payment.contact_email as string) && (
									<Text size='sm' c='dimmed'>{payment.contact_email as string}</Text>
								)}
								{(payment.contact_phone as string) && (
									<Text size='sm' c='dimmed'>{payment.contact_phone as string}</Text>
								)}
							</Card>
						</div>

						{/* Invoice Information */}
						{(payment.invoice_number as string) && (
							<div>
								<Text size='sm' c='dimmed' mb='xs'>Invoice</Text>
								<Card withBorder p='sm'>
									<Text fw={500}>{payment.invoice_number as string}</Text>
								</Card>
							</div>
						)}

						{/* Payment Details */}
						<Group grow>
							<div>
								<Text size='sm' c='dimmed'>Payment Method</Text>
								<Text fw={500}>{(payment.paymentMethod as string) || 'Not specified'}</Text>
							</div>
							<div>
								<Text size='sm' c='dimmed'>Payment Type</Text>
								<Text fw={500}>{(payment.type as string) || 'payment'}</Text>
							</div>
						</Group>

						{/* Notes */}
						{(payment.notes as string) && (
							<div>
								<Text size='sm' c='dimmed' mb='xs'>Notes</Text>
								<Card withBorder p='sm'>
									<Text size='sm'>{payment.notes as string}</Text>
								</Card>
							</div>
						)}

						{/* Metadata */}
						<div>
							<Text size='sm' c='dimmed' mb='xs'>Payment ID</Text>
							<Text className='geist' size='sm'>{payment.id as string}</Text>
						</div>

						<div>
							<Text size='sm' c='dimmed' mb='xs'>Created</Text>
							<Text className='geist' size='sm'>{formatUnixTimestamp(payment.created_at as number)}</Text>
						</div>
					</Stack>
				</ScrollArea>
			</Stack>
		</Paper>
	)
}