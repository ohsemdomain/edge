// _client/features/archive/ArchivePage.tsx
import { Badge, Box, Flex, Group, Tabs, Text } from '@mantine/core'
import { trpc } from '~c/trpc'
import { GenericArchive } from './GenericArchive'

interface ArchiveConfigItem {
	key: 'contacts' | 'items'
	label: string
	count: number
	renderItem: (item: any) => React.ReactNode
}

export function ArchivePage() {
	// Get counts for all features
	const { data: archivedContacts } = trpc.contacts.list.useQuery({
		search: '',
		page: 1,
		limit: 1000,
		isActive: false
	})

	const { data: archivedItems } = trpc.items.list.useQuery({
		search: '',
		page: 1,
		limit: 1000,
		isActive: false
	})

	const archiveConfig: ArchiveConfigItem[] = [
		{
			key: 'contacts',
			label: 'Contacts',
			count: archivedContacts?.totalItems || 0,
			renderItem: (item) => (
				<>
					<Text fw={500}>{item.name}</Text>
					<Text size='sm' c='dimmed'>
						{item.phone}
					</Text>
				</>
			)
		},
		{
			key: 'items',
			label: 'Items',
			count: archivedItems?.totalItems || 0,
			renderItem: (item) => (
				<>
					<Text fw={500}>{item.name}</Text>
					<Text size='sm' c='dimmed' className='geist'>
						ID: {item.id.slice(0, 8)}...
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
							<GenericArchive feature={config.key} renderItem={config.renderItem} />
						</Tabs.Panel>
					))}
				</Tabs>
			</Box>
		</Flex>
	)
}