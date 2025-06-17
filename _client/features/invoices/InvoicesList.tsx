// _client/features/invoices/InvoicesList.tsx
import { ActionIcon, Badge, Card, Group, Stack, Text, TextInput } from '@mantine/core'
import { useVirtualizer } from '@tanstack/react-virtual'
import { Plus, Search } from 'lucide-react'
import { useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { formatDateForDisplay, formatCurrency } from '~c/lib/formatter'
import { trpc } from '~c/trpc'

interface InvoicesListProps {
	selectedId: string
	onSelect: (id: string) => void
}

export function InvoicesList({ selectedId, onSelect }: InvoicesListProps) {
	const [searchParams, setSearchParams] = useSearchParams()
	const navigate = useNavigate()
	const [search, setSearch] = useState('')
	const parentRef = useRef<HTMLDivElement>(null)

	// Load all invoices at once
	const { data } = trpc.invoices.list.useQuery({
		search: '', // Always empty for server
		page: 1,
		limit: 1000, // Get all invoices
		isActive: true
	})

	// Client-side filter
	const filteredInvoices = search
		? data?.invoices?.filter(
				(invoice) =>
					invoice.invoiceNumber.toLowerCase().includes(search.toLowerCase()) ||
					invoice.contactName.toLowerCase().includes(search.toLowerCase())
			) || []
		: data?.invoices || []

	// Virtual scrolling
	const virtualizer = useVirtualizer({
		count: filteredInvoices.length,
		getScrollElement: () => parentRef.current,
		estimateSize: () => 75, // Estimated height of each item in pixels
		overscan: 10 // Render 10 extra items outside viewport
	})

	const handleSearch = (value: string) => {
		setSearch(value)
		// Still update URL for selected item clearing
		if (value) {
			const params = new URLSearchParams(searchParams)
			params.delete('id')
			setSearchParams(params)
		}
	}


	const getStatusBadge = (status: string) => {
		const colors = {
			paid: 'green',
			partial: 'yellow',
			unpaid: 'red'
		}
		return colors[status as keyof typeof colors] || 'gray'
	}

	const calculateInvoiceStatus = (invoice: any) => {
		const totalAmount = invoice.total
		const paidAmount = totalAmount - invoice.balance
		
		if (paidAmount <= 0) {
			return 'unpaid'
		} else if (paidAmount >= totalAmount) {
			return 'paid'
		} else {
			return 'partial'
		}
	}

	return (
		<Stack h='100%' gap='sm'>
			<Group gap='xs' align='stretch'>
				<TextInput
					placeholder='Search invoices...'
					leftSection={<Search size={16} />}
					value={search}
					onChange={(e) => handleSearch(e.target.value)}
					style={{ flex: 1 }}
				/>
				<Badge
					size='lg'
					radius='sm'
					bg='gray.2'
					c='gray.5'
					style={{
						height: 'var(--input-height, 36px)',
						paddingInline: 12,
						minWidth: 50
					}}
				>
					{data?.totalItems || 0}
				</Badge>
				<ActionIcon size='input-sm' variant='filled' onClick={() => navigate('/invoices/new')}>
					<Plus size={18} />
				</ActionIcon>
			</Group>

			<div
				ref={parentRef}
				style={{
					height: '100%',
					width: '100%',
					overflow: 'auto',
					scrollbarWidth: 'none', // Firefox
					msOverflowStyle: 'none' // IE and Edge
				}}
				className='hide-scrollbar'
			>
				<div
					style={{
						height: `${virtualizer.getTotalSize()}px`,
						width: '100%',
						position: 'relative'
					}}
				>
					{virtualizer.getVirtualItems().map((virtualItem) => {
						const invoice = filteredInvoices[virtualItem.index]
						return (
							<div
								key={invoice.id}
								style={{
									position: 'absolute',
									top: 0,
									left: 0,
									width: '100%',
									height: `${virtualItem.size}px`,
									transform: `translateY(${virtualItem.start}px)`
								}}
							>
								<Card
									padding='md'
									radius={0}
									withBorder
									onClick={() => onSelect(invoice.id)}
									style={{
										cursor: 'pointer',
										backgroundColor:
											selectedId === invoice.id ? 'var(--mantine-color-gray-1)' : undefined,
										borderColor:
											selectedId === invoice.id ? 'var(--mantine-color-gray-4)' : undefined
									}}
								>
									<Stack gap={1}>
										<Group justify='space-between'>
											<Text size='md' fw={500} truncate style={{ maxWidth: '200px' }}>
												{invoice.contactName}
											</Text>
											<Text className='geist' size='sm' fw={500}>
												{formatCurrency(invoice.total)}
											</Text>
										</Group>
										<Group justify='space-between'>
											<Group gap='xs' align='center'>
												<Text size='xs' c='dimmed'>
													{invoice.invoiceNumber}
												</Text>
												<Text size='xs' c='dimmed'>
													•
												</Text>
												<Text size='xs' c='dimmed'>
													{formatDateForDisplay(new Date(invoice.invoiceDate))}
												</Text>
											</Group>
											<Text size='10px' c={getStatusBadge(calculateInvoiceStatus(invoice))} fw={500}>
												{calculateInvoiceStatus(invoice).toUpperCase()}
											</Text>
										</Group>
									</Stack>
								</Card>
							</div>
						)
					})}
				</div>
			</div>
		</Stack>
	)
}
