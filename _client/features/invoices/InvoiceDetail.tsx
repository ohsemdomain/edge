// _client/features/invoices/InvoiceDetail.tsx
import { ActionIcon, Badge, Button, Card, Group, Paper, ScrollArea, Stack, Table, Text, Title, Divider } from '@mantine/core'
import { Archive, Edit, Plus } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { formatDate, formatDateForDisplay, formatCurrency } from '~c/lib/formatter'
import { useArchiveActions } from '~c/lib/useArchive'
import { trpc } from '~c/trpc'
import { CustomLink } from '~c/components/CustomLink'
import { PaymentModal } from './PaymentModal'

interface InvoiceDetailProps {
	invoiceId: string
}

export function InvoiceDetail({ invoiceId }: InvoiceDetailProps) {
	const navigate = useNavigate()
	const [paymentModalOpen, setPaymentModalOpen] = useState(false)
	const [shareToken, setShareToken] = useState<string | null>(null)

	const { data: invoice, refetch } = trpc.invoices.getById.useQuery({ id: invoiceId })
	const generateShareLink = trpc.invoices.generateShareLink.useMutation()

	const { handleToggleActive, isToggling } = useArchiveActions('invoices', () => {
		navigate('/invoices')
	})

	// Generate share link automatically when component loads
	useEffect(() => {
		if (invoiceId && !shareToken && !generateShareLink.isPending) {
			generateShareLink.mutateAsync({ id: invoiceId })
				.then((result) => {
					setShareToken(result.shareToken)
				})
				.catch((error) => {
					console.error('Failed to generate share link:', error)
				})
		}
	}, [invoiceId])

	const shareUrl = shareToken ? `${window.location.origin}/share/invoice/${shareToken}` : null


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
							<Title order={2}>{invoice.invoice_number}</Title>
							<Text c='dimmed' size='sm'>
								Invoice Details
							</Text>
						</div>
						<Group>
							{shareUrl ? (
								<CustomLink 
									url={shareUrl} 
									label="Share"
									variant="button"
									size="sm"
								/>
							) : (
								<Button
									size='sm'
									variant='outline'
									loading={generateShareLink.isPending}
									disabled
								>
									Generating Link...
								</Button>
							)}
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
								onClick={() => navigate(`/invoices/edit/${invoice.id}`)}
							>
								Edit
							</Button>
							<Button
								bg='gray.1'
								c='dimmed'
								leftSection={<Archive size={16} />}
								onClick={() => {
									if (window.confirm('Move this invoice to archive?')) {
										handleToggleActive(invoice.id, true)
									}
								}}
								disabled={isToggling}
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
									<Text fw={500}>{invoice.contact_name}</Text>
									{invoice.contact_email && (
										<Text size='sm' c='dimmed'>{invoice.contact_email}</Text>
									)}
									{invoice.contact_phone && (
										<Text size='sm' c='dimmed'>{invoice.contact_phone}</Text>
									)}
								</Card>
							</div>

							{/* Invoice Details */}
							<Group grow>
								<div>
									<Text size='sm' c='dimmed'>Invoice Number</Text>
									<Text fw={500} className='geist'>{invoice.invoice_number}</Text>
								</div>
								<div>
									<Text size='sm' c='dimmed'>Invoice Date</Text>
									<Text fw={500}>{formatDateForDisplay(new Date(invoice.invoiceDate))}</Text>
								</div>
								{invoice.dueDate && (
									<div>
										<Text size='sm' c='dimmed'>Due Date</Text>
										<Text fw={500}>{formatDateForDisplay(new Date(invoice.dueDate))}</Text>
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
											{invoice.items.map((item) => (
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
							{invoice.notes && (
								<div>
									<Text size='sm' c='dimmed' mb='xs'>Notes</Text>
									<Card withBorder p='sm'>
										<Text size='sm'>{invoice.notes}</Text>
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
												{invoice.payments.map((payment) => (
													<Table.Tr key={payment.id}>
														<Table.Td>
															<Text size='sm'>
																{formatDateForDisplay(new Date(payment.paymentDate))}
															</Text>
														</Table.Td>
														<Table.Td>
															<Text size='sm'>{payment.payment_method || 'N/A'}</Text>
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

							{/* Share Link Section */}
							{shareUrl && (
								<div>
									<Text size='sm' c='dimmed' mb='xs'>Client Share Link</Text>
									<Card withBorder p='sm'>
										<CustomLink 
											url={shareUrl} 
											variant="input"
											size="sm"
										/>
									</Card>
								</div>
							)}

							{/* Metadata */}
							<div>
								<Text size='sm' c='dimmed' mb='xs'>Invoice ID</Text>
								<Text className='geist' size='sm'>{invoice.id}</Text>
							</div>

							<div>
								<Text size='sm' c='dimmed' mb='xs'>Created</Text>
								<Text className='geist' size='sm'>{formatDate(invoice.created_at)}</Text>
							</div>
						</Stack>
					</ScrollArea>
				</Stack>
			</Paper>

			<PaymentModal
				opened={paymentModalOpen}
				onClose={() => setPaymentModalOpen(false)}
				contactId={invoice.contact_id}
				invoiceId={invoice.id}
				onSuccess={() => {
					refetch()
					setPaymentModalOpen(false)
				}}
			/>
		</>
	)
}