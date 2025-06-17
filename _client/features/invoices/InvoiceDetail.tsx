// _client/features/invoices/InvoiceDetail.tsx
import { ActionIcon, Badge, Button, Card, Group, Paper, ScrollArea, Stack, Table, Text, Title, Divider } from '@mantine/core'
import { Archive, Edit, Plus } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { formatCurrency, formatUnixTimestamp } from '~c/lib/formatter'
import { trpc } from '~c/trpc'
import { PaymentModal } from './PaymentModal'

interface InvoiceDetailProps {
	invoiceId: string
}

export function InvoiceDetail({ invoiceId }: InvoiceDetailProps) {
	const navigate = useNavigate()
	const utils = trpc.useUtils()
	const [paymentModalOpen, setPaymentModalOpen] = useState(false)

	const { data: invoice, refetch } = trpc.invoices.getById.useQuery({ id: invoiceId })

	const toggleActiveMutation = trpc.invoices.toggleActive.useMutation({
		onSuccess: () => {
			navigate('/invoices')
			utils.invoices.list.invalidate()
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



	const getStatusBadge = (status: string) => {
		const colors = {
			paid: 'green',
			partial: 'yellow',
			unpaid: 'red'
		}
		return colors[status as keyof typeof colors] || 'gray'
	}

	if (!invoice) return null

	return (
		<>
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
							<Title order={2}>{invoice.invoice_number as string}</Title>
							<Text c='dimmed' size='sm'>
								Invoice Details
							</Text>
						</div>
						<Group>
							<Button
								size='sm'
								variant='outline'
								leftSection={<Plus size={16} />}
								onClick={() => setPaymentModalOpen(true)}
							>
								Add Payment
							</Button>
							<Button
								leftSection={<Edit size={16} />}
								onClick={() => navigate(`/invoices/edit/${invoice.id as string}`)}
							>
								Edit
							</Button>
							<Button
								bg='gray.1'
								c='dimmed'
								leftSection={<Archive size={16} />}
								onClick={() => {
									if (window.confirm('Move this invoice to archive?')) {
										handleToggleActive(invoice.id as string, invoice.is_active as boolean)
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
							{/* Invoice Status & Summary */}
							<Card withBorder>
								<Group justify='space-between' mb='md'>
									<Text fw={600}>Invoice Summary</Text>
									<Badge
										color={getStatusBadge(invoice.status)}
										size='lg'
										variant='light'
									>
										{invoice.status.toUpperCase()}
									</Badge>
								</Group>
								<Group justify='space-between'>
									<div>
										<Text size='sm' c='dimmed'>Total Amount</Text>
										<Text size='xl' fw={700}>{formatCurrency(invoice.total)}</Text>
									</div>
									<div style={{ textAlign: 'right' }}>
										<Text size='sm' c='dimmed'>Contact Balance</Text>
										<Text 
											size='lg' 
											fw={600}
											c={invoice.contactBalance > 0 ? 'red' : 'green'}
										>
											{formatCurrency(invoice.contactBalance)}
										</Text>
									</div>
								</Group>
							</Card>

							{/* Contact Information */}
							<div>
								<Text size='sm' c='dimmed' mb='xs'>Customer</Text>
								<Card withBorder p='sm'>
									<Text fw={500}>{invoice.contact_name as string}</Text>
									{(invoice.contact_email as string) && (
										<Text size='sm' c='dimmed'>{invoice.contact_email as string}</Text>
									)}
									{(invoice.contact_phone as string) && (
										<Text size='sm' c='dimmed'>{invoice.contact_phone as string}</Text>
									)}
								</Card>
							</div>

							{/* Invoice Details */}
							<Group grow>
								<div>
									<Text size='sm' c='dimmed'>Invoice Number</Text>
									<Text fw={500} className='geist'>{invoice.invoice_number as string}</Text>
								</div>
								<div>
									<Text size='sm' c='dimmed'>Invoice Date</Text>
									<Text fw={500}>{formatUnixTimestamp(invoice.invoiceDate)}</Text>
								</div>
								{invoice.dueDate && (
									<div>
										<Text size='sm' c='dimmed'>Due Date</Text>
										<Text fw={500}>{formatUnixTimestamp(invoice.dueDate)}</Text>
									</div>
								)}
							</Group>

							{/* Line Items */}
							<div>
								<Text size='sm' c='dimmed' mb='xs'>Line Items</Text>
								<Card withBorder p={0}>
									<Table>
										<Table.Thead>
											<Table.Tr>
												<Table.Th>Description</Table.Th>
												<Table.Th ta='center'>Qty</Table.Th>
												<Table.Th ta='right'>Unit Price</Table.Th>
												<Table.Th ta='right'>Total</Table.Th>
											</Table.Tr>
										</Table.Thead>
										<Table.Tbody>
											{invoice.items.map((item: any) => (
												<Table.Tr key={item.id}>
													<Table.Td>
														<Text size='sm'>{item.description}</Text>
														{item.item_name && (
															<Text size='xs' c='dimmed'>({item.item_name})</Text>
														)}
													</Table.Td>
													<Table.Td ta='center'>
														<Text size='sm' className='geist'>{item.quantity}</Text>
													</Table.Td>
													<Table.Td ta='right'>
														<Text size='sm' className='geist'>{formatCurrency(item.unit_price)}</Text>
													</Table.Td>
													<Table.Td ta='right'>
														<Text size='sm' fw={500} className='geist'>
															{formatCurrency(item.quantity * item.unit_price)}
														</Text>
													</Table.Td>
												</Table.Tr>
											))}
										</Table.Tbody>
										<Table.Tfoot>
											<Table.Tr>
												<Table.Td colSpan={3} ta='right'>
													<Text fw={600}>Total:</Text>
												</Table.Td>
												<Table.Td ta='right'>
													<Text fw={700} size='lg' className='geist'>
														{formatCurrency(invoice.total)}
													</Text>
												</Table.Td>
											</Table.Tr>
										</Table.Tfoot>
									</Table>
								</Card>
							</div>

							{/* Notes */}
							{(invoice.notes as string) && (
								<div>
									<Text size='sm' c='dimmed' mb='xs'>Notes</Text>
									<Card withBorder p='sm'>
										<Text size='sm'>{invoice.notes as string}</Text>
									</Card>
								</div>
							)}

							<Divider />

							{/* Payment History */}
							<div>
								<Group justify='space-between' align='center' mb='xs'>
									<Text size='sm' c='dimmed'>Payment History</Text>
									<ActionIcon
										variant='light'
										size='sm'
										onClick={() => setPaymentModalOpen(true)}
									>
										<Plus size={16} />
									</ActionIcon>
								</Group>
								{invoice.payments.length > 0 ? (
									<Card withBorder p={0}>
										<Table>
											<Table.Thead>
												<Table.Tr>
													<Table.Th>Date</Table.Th>
													<Table.Th>Method</Table.Th>
													<Table.Th ta='right'>Amount</Table.Th>
													<Table.Th>Notes</Table.Th>
												</Table.Tr>
											</Table.Thead>
											<Table.Tbody>
												{invoice.payments.map((payment: any) => (
													<Table.Tr key={payment.id}>
														<Table.Td>
															<Text size='sm'>
																{formatUnixTimestamp(payment.paymentDate)}
															</Text>
														</Table.Td>
														<Table.Td>
															<Text size='sm'>{payment.paymentMethod || 'N/A'}</Text>
														</Table.Td>
														<Table.Td ta='right'>
															<Text size='sm' fw={500} className='geist'>
																{formatCurrency(payment.amount)}
															</Text>
														</Table.Td>
														<Table.Td>
															<Text size='sm' c='dimmed'>
																{payment.notes || '—'}
															</Text>
														</Table.Td>
													</Table.Tr>
												))}
											</Table.Tbody>
										</Table>
									</Card>
								) : (
									<Card withBorder p='sm'>
										<Text size='sm' c='dimmed' ta='center'>
											No payments recorded yet
										</Text>
									</Card>
								)}
							</div>


							{/* Metadata */}
							<div>
								<Text size='sm' c='dimmed' mb='xs'>Invoice ID</Text>
								<Text className='geist' size='sm'>{invoice.id as string}</Text>
							</div>

							<div>
								<Text size='sm' c='dimmed' mb='xs'>Created</Text>
								<Text className='geist' size='sm'>{formatUnixTimestamp(invoice.created_at)}</Text>
							</div>
						</Stack>
					</ScrollArea>
				</Stack>
			</Paper>

			<PaymentModal
				opened={paymentModalOpen}
				onClose={() => setPaymentModalOpen(false)}
				contactId={invoice.contact_id as string}
				invoiceId={invoice.id as string}
				onSuccess={() => {
					refetch()
					setPaymentModalOpen(false)
				}}
			/>
		</>
	)
}