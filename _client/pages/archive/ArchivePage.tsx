import { Stack, Tabs, Text, Title } from '@mantine/core'
import { ContactsArchive } from './ContactsArchive'
import { ItemsArchive } from './ItemsArchive'

export function ArchivePage() {
	return (
		<Stack>
			<div>
				<Title order={2}>Archive</Title>
				<Text c='dimmed' size='sm'>
					Inactive records
				</Text>
			</div>

			<Tabs defaultValue='contacts'>
				<Tabs.List>
					<Tabs.Tab value='contacts'>Contacts</Tabs.Tab>
					<Tabs.Tab value='items'>Items</Tabs.Tab>
				</Tabs.List>

				<Tabs.Panel value='contacts' pt='md'>
					<ContactsArchive />
				</Tabs.Panel>

				<Tabs.Panel value='items' pt='md'>
					<ItemsArchive />
				</Tabs.Panel>
			</Tabs>
		</Stack>
	)
}
