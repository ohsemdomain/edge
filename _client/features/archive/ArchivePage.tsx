import { Box, Flex, ScrollArea, Tabs } from '@mantine/core'
import { ContactsArchive } from './ContactsArchive'
import { ItemsArchive } from './ItemsArchive'

export function ArchivePage() {
	return (
		<Flex h='100%' style={{ justifyContent: 'center', overflow: 'hidden' }}>
			<Box maw={800} w='100%' h='100%' p='md'>
				<Tabs
					defaultValue='contacts'
					style={{ display: 'flex', flexDirection: 'column', height: '100%' }}
				>
					<Tabs.List>
						<Tabs.Tab value='contacts'>Contacts</Tabs.Tab>
						<Tabs.Tab value='items'>Items</Tabs.Tab>
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
