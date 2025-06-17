// _client/features/invoices/InvoiceDetail.tsx
import { ActionIcon, Button, Card, Group, Paper, ScrollArea, Stack, Table, Text, Title, Divider } from '@mantine/core'
import { Edit, Plus, Trash2 } from 'lucide-react'
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

	const { data: invoice, refetch } = trpc.invoices.getById.useQuery(invoiceId)

	const deleteMutation = trpc.invoices.delete.useMutation({
		onSuccess: () => {
			toast.success('Invoice deleted successfully')
			utils.invoices.list.invalidate()
			navigate('/invoices')
		},
		onError: (error) => {
			toast.error(error.message || 'Failed to delete invoice')
		}
	})

	const handleDelete = () => {
		if (window.confirm('Are you sure you want to delete this invoice? This action cannot be undone.')) {
			deleteMutation.mutate(invoiceId)
		}
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
							<Title order={2}>{invoice.invoiceNumber}</Title>
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
							{/* Invoice Status & Summary */}
							<Card withBorder>
								<Group justify='space-between' mb='md'>
									<Text fw={600}>Invoice Summary</Text>
								</Group>
								<Group justify='space-between'>
									<div>
										<Text size='sm' c='dimmed'>Total Amount</Text>
										<Text size='xl' fw={700}>{formatCurrency(invoice.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0))}</Text>
									</div>
									<div style={{ textAlign: 'right' }}>
										<Text size='sm' c='dimmed'>Contact Balance</Text>
										<Text 
											size='lg' 
											fw={600}
											c={invoice.balance > 0 ? 'red' : 'green'}
										>
											{formatCurrency(invoice.balance)}
										</Text>
									</div>
								</Group>
							</Card>

							{/* Contact Information */}
							<div>
								<Text size='sm' c='dimmed' mb='xs'>Customer</Text>
								<Card withBorder p='sm'>
									<Text fw={500}>{invoice.contactName as string}</Text>
									{(invoice.contactEmail as string) && (
										<Text size='sm' c='dimmed'>{invoice.contactEmail as string}</Text>
									)}
									{(invoice.contactPhone as string) && (
										<Text size='sm' c='dimmed'>{invoice.contactPhone as string}</Text>
									)}
								</Card>
							</div>

							{/* Invoice Details */}
							<Group grow>
								<div>
									<Text size='sm' c='dimmed'>Invoice Number</Text>
									<Text fw={500} className='geist'>{invoice.invoiceNumber as string}</Text>
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
														{item.itemName && (
															<Text size='xs' c='dimmed'>({item.itemName})</Text>
														)}
													</Table.Td>
													<Table.Td ta='center'>
														<Text size='sm' className='geist'>{item.quantity}</Text>
													</Table.Td>
													<Table.Td ta='right'>
														<Text size='sm' className='geist'>{formatCurrency(item.unitPrice)}</Text>
													</Table.Td>
													<Table.Td ta='right'>
														<Text size='sm' fw={500} className='geist'>
															{formatCurrency(item.quantity * item.unitPrice)}
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
								<Text className='geist' size='sm'>{formatUnixTimestamp(invoice.createdAt)}</Text>
							</div>
						</Stack>
					</ScrollArea>
				</Stack>
			</Paper>

			<PaymentModal
				opened={paymentModalOpen}
				onClose={() => setPaymentModalOpen(false)}
				contactId={invoice.contactId as string}
				invoiceId={invoice.id as string}
				onSuccess={() => {
					refetch()
					utils.invoices.list.invalidate()
					setPaymentModalOpen(false)
				}}
			/>
		</>
	)
}