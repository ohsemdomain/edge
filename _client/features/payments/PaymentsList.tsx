// _client/features/payments/PaymentsList.tsx
import { ActionIcon, Badge, Card, Group, Stack, Text, TextInput } from '@mantine/core'
import { useVirtualizer } from '@tanstack/react-virtual'
import { Plus, Search } from 'lucide-react'
import { useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { formatCurrency, formatUnixTimestamp } from '~c/lib/formatter'
import { trpc } from '~c/trpc'

interface PaymentsListProps {
	selectedId: string
	onSelect: (id: string) => void
}

export function PaymentsList({ selectedId, onSelect }: PaymentsListProps) {
	const [searchParams, setSearchParams] = useSearchParams()
	const navigate = useNavigate()
	const [search, setSearch] = useState('')
	const parentRef = useRef<HTMLDivElement>(null)

	// Load all payments at once
	const { data } = trpc.payments.list.useQuery({
		search: '', // Always empty for server
		page: 1,
		limit: 1000, // Get all payments
		isActive: true
	})

	// Client-side filter
	const filteredPayments = search
		? data?.payments?.filter((payment) => 
			payment.contactName?.toLowerCase().includes(search.toLowerCase()) ||
			payment.invoiceNumber?.toLowerCase().includes(search.toLowerCase()) ||
			payment.notes?.toLowerCase().includes(search.toLowerCase())
		) || []
		: data?.payments || []

	// Virtual scrolling
	const virtualizer = useVirtualizer({
		count: filteredPayments.length,
		getScrollElement: () => parentRef.current,
		estimateSize: () => 80, // Estimated height of each item in pixels
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

	const getTypeColor = (type: string) => {
		return type === 'refund' ? 'red' : 'green'
	}

	const getTypeLabel = (type: string) => {
		return type === 'refund' ? 'Refund' : 'Payment'
	}

	return (
		<Stack h='100%' gap='sm'>
			<Group gap='xs' align='stretch'>
				<TextInput
					placeholder='Search payments...'
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
				<ActionIcon size='input-sm' variant='filled' onClick={() => navigate('/payments/new')}>
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
						const payment = filteredPayments[virtualItem.index]
						return (
							<div
								key={payment.id}
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
									onClick={() => onSelect(payment.id)}
									style={{
										cursor: 'pointer',
										backgroundColor:
											selectedId === payment.id ? 'var(--mantine-color-gray-1)' : undefined,
										borderColor: selectedId === payment.id ? 'var(--mantine-color-gray-4)' : undefined
									}}
								>
									<Group justify='space-between' align='start' mb='xs'>
										<Text fw={500}>{payment.contactName || 'Unknown Contact'}</Text>
										<Group gap='xs'>
											<Badge size='xs' color={getTypeColor(payment.type || 'payment')}>
												{getTypeLabel(payment.type || 'payment')}
											</Badge>
											<Text size='sm' fw={500}>
												{formatCurrency(payment.amount)}
											</Text>
										</Group>
									</Group>
									<Group justify='space-between' align='center'>
										<Text size='xs' c='dimmed'>
											{payment.invoiceNumber ? `Invoice: ${payment.invoiceNumber}` : 'No Invoice'}
										</Text>
										<Text size='xs' c='dimmed'>
											{formatUnixTimestamp(payment.paymentDate)}
										</Text>
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