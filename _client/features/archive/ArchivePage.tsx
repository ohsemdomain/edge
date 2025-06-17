// _client/features/archive/ArchivePage.tsx
import { Badge, Box, Flex, Group, Tabs, Text } from '@mantine/core'
import { GenericArchive } from './GenericArchive'
import { useArchiveStore } from '~c/stores/useArchiveStore'
import { formatCurrency, formatUnixTimestamp } from '~c/lib/formatter'

interface ArchiveConfigItem {
	key: 'contacts' | 'items' | 'invoices' | 'payments'
	label: string
	count: number
	renderItem: (item: any) => React.ReactNode
}

export function ArchivePage() {
	const { counts } = useArchiveStore()

	const archiveConfig: ArchiveConfigItem[] = [
		{
			key: 'contacts',
			label: 'Contacts',
			count: counts.contacts || 0,
			renderItem: (item) => (
				<>
					<Text fw={500}>{item.company_name.toUpperCase()}</Text>
					<Text size='sm' c='dimmed'>
						{item.person_incharge}
					</Text>
					<Text size='sm' c='dimmed'>
						{item.is_supplier ? 'Supplier' : 'Client'}
					</Text>
				</>
			)
		},
		{
			key: 'items',
			label: 'Items',
			count: counts.items || 0,
			renderItem: (item) => (
				<>
					<Text fw={500}>{item.name}</Text>
					<Text size='sm' c='dimmed'>
						${item.unit_price.toFixed(2)}
					</Text>
					<Text size='sm' c='dimmed' className='geist'>
						ID: {item.id.slice(0, 8)}...
					</Text>
				</>
			)
		},
		{
			key: 'invoices',
			label: 'Invoices',
			count: counts.invoices || 0,
			renderItem: (item) => (
				<>
					<Text fw={500}>{item.invoice_number}</Text>
					<Text size='sm' c='dimmed'>
						{item.contact_name}
					</Text>
					<Text size='sm' c='dimmed' className='geist'>
						${item.total.toFixed(2)}
					</Text>
				</>
			)
		},
		{
			key: 'payments',
			label: 'Payments',
			count: counts.payments || 0,
			renderItem: (item) => (
				<>
					<Group justify='space-between' w='100%'>
						<div>
							<Text fw={500}>{item.contactName || 'Unknown Contact'}</Text>
							<Text size='sm' c='dimmed'>
								{item.invoiceNumber ? `Invoice: ${item.invoiceNumber}` : 'No Invoice'}
							</Text>
						</div>
						<div style={{ textAlign: 'right' }}>
							<Text fw={500}>{formatCurrency(item.amount)}</Text>
							<Badge size='xs' color={item.type === 'refund' ? 'red' : 'green'}>
								{item.type === 'refund' ? 'Refund' : 'Payment'}
							</Badge>
						</div>
					</Group>
					<Text size='xs' c='dimmed'>
						{formatUnixTimestamp(item.paymentDate)}
					</Text>
				</>
			)
		}
	]

	return (
		<Flex h='100%' style={{ justifyContent: 'center', overflow: 'hidden' }}>
			<Box maw={800} w='100%' h='100%' p='md'>
				<Tabs
					defaultValue='contacts'
					style={{ display: 'flex', flexDirection: 'column', height: '100%' }}
				>
					<Tabs.List>
						{archiveConfig.map((config) => (
							<Tabs.Tab key={config.key} value={config.key}>
								<Group gap='xs' align='center'>
									{config.label}
									<Badge size='xs' radius='sm' bg='gray.3' c='gray.6' style={{ minWidth: 20 }}>
										{config.count}
									</Badge>
								</Group>
							</Tabs.Tab>
						))}
					</Tabs.List>

					{archiveConfig.map((config) => (
						<Tabs.Panel
							key={config.key}
							value={config.key}
							pt='md'
							style={{ flex: 1, overflow: 'hidden' }}
						>
							<GenericArchive 
							feature={config.key} 
							renderItem={config.renderItem}
						/>
						</Tabs.Panel>
					))}
				</Tabs>
			</Box>
		</Flex>
	)
}
