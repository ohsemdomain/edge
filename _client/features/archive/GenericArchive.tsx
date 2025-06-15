// _client/features/archive/GenericArchive.tsx
import { Card, Group, ScrollArea, Stack, TextInput } from '@mantine/core'
import { Search } from 'lucide-react'
import { useState } from 'react'
import { ArchiveActions } from '~c/components/ArchiveActions'
import { useArchiveActions } from '~c/lib/useArchive'
import { trpc } from '~c/trpc'

interface GenericArchiveProps {
	feature: 'items' | 'contacts'
	renderItem: (item: any) => React.ReactNode
}

export function GenericArchive({ feature, renderItem }: GenericArchiveProps) {
	const [search, setSearch] = useState('')

	// Handle different query structures
	const query =
		feature === 'contacts'
			? trpc.contacts.list.useQuery({
					search: '',
					page: 1,
					limit: 1000,
					isActive: false
				})
			: trpc.items.list.useQuery({
					search: '',
					page: 1,
					limit: 1000,
					isActive: false
				})

	const { handleToggleActive, handleDelete, isToggling, isDeleting } = useArchiveActions(
		feature,
		() => query.refetch()
	)

	// Get items array from either format
	const items =
		feature === 'contacts' ? (query.data as any)?.contacts || [] : (query.data as any)?.items || []

	// Client-side filter
	const filteredItems = search
		? items.filter((item: any) =>
				Object.values(item).some((value) =>
					String(value).toLowerCase().includes(search.toLowerCase())
				)
			)
		: items

	return (
		<Stack h='100%'>
			<TextInput
				placeholder={`Search archived ${feature}...`}
				leftSection={<Search size={16} />}
				value={search}
				onChange={(e) => setSearch(e.target.value)}
			/>

			<ScrollArea style={{ flex: 1 }}>
				<Stack gap='xs'>
					{filteredItems.map((item: any) => (
						<Card key={item.id} padding='sm' withBorder>
							<Group justify='space-between'>
								<div>{renderItem(item)}</div>
								<ArchiveActions
									onToggleActive={() => handleToggleActive(item.id, false)}
									onDelete={() => handleDelete(item.id, item.name)}
									isActive={false}
									isToggling={isToggling}
									isDeleting={isDeleting}
								/>
							</Group>
						</Card>
					))}
				</Stack>
			</ScrollArea>
		</Stack>
	)
}