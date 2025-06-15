// _client/features/invoices/InvoicesList.tsx
import { ActionIcon, Badge, Card, Group, Stack, Text, TextInput } from '@mantine/core'
import { useVirtualizer } from '@tanstack/react-virtual'
import { Plus, Search } from 'lucide-react'
import { useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { formatDateForDisplay } from '~c/lib/formatter'
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
		? data?.invoices?.filter((invoice) => 
			invoice.invoice_number.toLowerCase().includes(search.toLowerCase()) ||
			invoice.contact_name.toLowerCase().includes(search.toLowerCase())
		) || []
		: data?.invoices || []

	// Virtual scrolling
	const virtualizer = useVirtualizer({
		count: filteredInvoices.length,
		getScrollElement: () => parentRef.current,
		estimateSize: () => 90, // Estimated height of each item in pixels
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

	const formatCurrency = (amount: number) => {
		return new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: 'USD',
			minimumFractionDigits: 2,
			maximumFractionDigits: 2
		}).format(amount)
	}

	const getStatusBadge = (status: string) => {
		const colors = {
			paid: 'green',
			partial: 'yellow',
			unpaid: 'red'
		}
		return colors[status as keyof typeof colors] || 'gray'
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
					{data?.totalInvoices || 0}
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
									transform: `translateY(${virtualItem.start}px)`,
									paddingBottom: '8px'
								}}
							>
								<Card
									padding='sm'
									radius={0}
									withBorder
									onClick={() => onSelect(invoice.id)}
									style={{
										cursor: 'pointer',
										backgroundColor:
											selectedId === invoice.id ? 'var(--mantine-color-gray-1)' : undefined,
										borderColor: selectedId === invoice.id ? 'var(--mantine-color-gray-4)' : undefined
									}}
								>
									<Group justify='space-between' align='start' mb='xs'>
										<div>
											<Text fw={600} size='sm'>
												{invoice.invoice_number}
											</Text>
											<Text size='xs' c='dimmed'>
												{formatDateForDisplay(new Date(invoice.invoiceDate))}
											</Text>
										</div>
										<Badge
											color={getStatusBadge(invoice.status)}
											size='sm'
											variant='light'
										>
											{invoice.status}
										</Badge>
									</Group>
									<Group justify='space-between' align='center'>
										<div style={{ flex: 1 }}>
											<Text size='sm' truncate>
												{invoice.contact_name}
											</Text>
											<Text className='geist' size='xs' c='dimmed'>
												{invoice.id}
											</Text>
										</div>
										<div style={{ textAlign: 'right' }}>
											<Text size='sm' fw={500}>
												{formatCurrency(invoice.total)}
											</Text>
											<Text
												size='xs'
												c={invoice.contactBalance > 0 ? 'red' : 'green'}
												fw={500}
											>
												{invoice.contactBalance > 0 ? 'Owes: ' : 'Credit: '}
												{formatCurrency(Math.abs(invoice.contactBalance))}
											</Text>
										</div>
									</Group>
								</Card>
							</div>
						)
					})}
				</div>
			</div>
		</Stack>
	)
}