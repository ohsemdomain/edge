// _client/features/invoices/InvoiceItems.tsx
import { ActionIcon, Group, NumberInput, Select, Table, Text, TextInput } from '@mantine/core'
import { Plus, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { trpc } from '~c/trpc'

interface InvoiceItem {
	id?: string
	itemId?: string
	description: string
	quantity: number
	unitPrice: number
}

interface InvoiceItemsProps {
	items: InvoiceItem[]
	onChange: (items: InvoiceItem[]) => void
}

export function InvoiceItems({ items, onChange }: InvoiceItemsProps) {
	const [localItems, setLocalItems] = useState<InvoiceItem[]>(items)

	// Load all items for the dropdown
	const { data: itemsData } = trpc.items.list.useQuery({
		search: '',
		page: 1,
		limit: 1000,
		isActive: true
	})

	// Sync local state with props
	useEffect(() => {
		setLocalItems(items)
	}, [items])

	// Convert items data to select options
	const itemOptions = itemsData?.items.map(item => ({
		value: item.id,
		label: `${item.name} - $${item.unitPrice.toFixed(2)}`,
		item: item
	})) || []

	const updateItem = (index: number, field: keyof InvoiceItem, value: any) => {
		const updated = [...localItems]
		updated[index] = { ...updated[index], [field]: value }
		
		// If selecting an item from dropdown, auto-fill description and price
		if (field === 'itemId' && value) {
			const selectedItem = itemsData?.items.find(item => item.id === value)
			if (selectedItem) {
				updated[index].description = selectedItem.name
				updated[index].unitPrice = selectedItem.unitPrice
			}
		}
		
		setLocalItems(updated)
		onChange(updated)
	}

	const addItem = () => {
		const newItem: InvoiceItem = {
			description: '',
			quantity: 1,
			unitPrice: 0
		}
		const updated = [...localItems, newItem]
		setLocalItems(updated)
		onChange(updated)
	}

	const removeItem = (index: number) => {
		const updated = localItems.filter((_, i) => i !== index)
		setLocalItems(updated)
		onChange(updated)
	}

	const formatCurrency = (amount: number) => {
		return new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: 'USD',
			minimumFractionDigits: 2,
			maximumFractionDigits: 2
		}).format(amount)
	}

	const calculateTotal = () => {
		return localItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0)
	}

	// Ensure we always have at least one row
	if (localItems.length === 0) {
		addItem()
	}

	return (
		<div>
			<Group justify='space-between' align='center' mb='sm'>
				<Text fw={500}>Line Items</Text>
				<ActionIcon
					variant='light'
					onClick={addItem}
				>
					<Plus size={16} />
				</ActionIcon>
			</Group>

			<Table withTableBorder withColumnBorders>
				<Table.Thead>
					<Table.Tr>
						<Table.Th style={{ width: '40%' }}>Description</Table.Th>
						<Table.Th style={{ width: '15%' }} ta='center'>Qty</Table.Th>
						<Table.Th style={{ width: '20%' }} ta='right'>Unit Price</Table.Th>
						<Table.Th style={{ width: '20%' }} ta='right'>Total</Table.Th>
						<Table.Th style={{ width: '5%' }}></Table.Th>
					</Table.Tr>
				</Table.Thead>
				<Table.Tbody>
					{localItems.map((item, index) => (
						<Table.Tr key={index}>
							<Table.Td>
								<div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
									<Select
										placeholder='Select item or type description'
										searchable
										clearable
										data={itemOptions}
										value={item.itemId || null}
										onChange={(value) => updateItem(index, 'itemId', value)}
										onSearchChange={(value) => {
											if (value && !item.itemId) {
												updateItem(index, 'description', value)
											}
										}}
										size='sm'
									/>
									<TextInput
										placeholder='Item description'
										value={item.description}
										onChange={(e) => updateItem(index, 'description', e.target.value)}
										size='sm'
									/>
								</div>
							</Table.Td>
							<Table.Td>
								<NumberInput
									value={item.quantity}
									onChange={(value) => updateItem(index, 'quantity', typeof value === 'number' ? value : 1)}
									min={0.01}
									step={0.01}
									decimalScale={2}
									hideControls
									size='sm'
									ta='center'
								/>
							</Table.Td>
							<Table.Td>
								<NumberInput
									value={item.unitPrice}
									onChange={(value) => updateItem(index, 'unitPrice', typeof value === 'number' ? value : 0)}
									min={0}
									step={0.01}
									decimalScale={2}
									prefix='$'
									hideControls
									size='sm'
									ta='right'
								/>
							</Table.Td>
							<Table.Td ta='right'>
								<Text fw={500} className='geist'>
									{formatCurrency(item.quantity * item.unitPrice)}
								</Text>
							</Table.Td>
							<Table.Td>
								{localItems.length > 1 && (
									<ActionIcon
										color='red'
										variant='subtle'
										size='sm'
										onClick={() => removeItem(index)}
									>
										<Trash2 size={14} />
									</ActionIcon>
								)}
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
								{formatCurrency(calculateTotal())}
							</Text>
						</Table.Td>
						<Table.Td></Table.Td>
					</Table.Tr>
				</Table.Tfoot>
			</Table>
		</div>
	)
}