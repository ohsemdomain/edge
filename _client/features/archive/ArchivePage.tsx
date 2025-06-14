import { Badge, Box, Flex, Group, Tabs } from '@mantine/core'
import { trpc } from '~c/utils/trpc'
import { ContactsArchive } from './ContactsArchive'
import { ItemsArchive } from './ItemsArchive'

export function ArchivePage() {
	// Get archived counts for badge display
	const { data: archivedContacts } = trpc.contacts.list.useQuery({
		search: '',
		page: 1,
		limit: 1000,
		status: 'inactive'
	})

	const { data: archivedItems } = trpc.items.list.useQuery({
		search: '',
		page: 1,
		limit: 1000,
		status: 'inactive'
	})

	return (
		<Flex h='100%' style={{ justifyContent: 'center', overflow: 'hidden' }}>
			<Box maw={800} w='100%' h='100%' p='md'>
				<Tabs
					defaultValue='contacts'
					style={{ display: 'flex', flexDirection: 'column', height: '100%' }}
				>
					<Tabs.List>
						<Tabs.Tab value='contacts'>
							<Group gap='xs' align='center'>
								Contacts
								<Badge
									size='xs'
									radius='sm'
									bg='gray.3'
									c='gray.6'
									style={{ minWidth: 20 }}
								>
									{archivedContacts?.totalItems || 0}
								</Badge>
							</Group>
						</Tabs.Tab>
						<Tabs.Tab value='items'>
							<Group gap='xs' align='center'>
								Items
								<Badge
									size='xs'
									radius='sm'
									bg='gray.3'
									c='gray.6'
									style={{ minWidth: 20 }}
								>
									{archivedItems?.totalItems || 0}
								</Badge>
							</Group>
						</Tabs.Tab>
					</Tabs.List>

					<Tabs.Panel value='contacts' pt='md' style={{ flex: 1, overflow: 'hidden' }}>
						<ContactsArchive />
					</Tabs.Panel>

					<Tabs.Panel value='items' pt='md' style={{ flex: 1, overflow: 'hidden' }}>
						<ItemsArchive />
					</Tabs.Panel>
				</Tabs>
			</Box>
		</Flex>
	)
}
