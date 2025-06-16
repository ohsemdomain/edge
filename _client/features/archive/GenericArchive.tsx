// _client/features/archive/GenericArchive.tsx
import { Card, Group, ScrollArea, Stack, TextInput } from '@mantine/core'
import { Search } from 'lucide-react'
import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { ArchiveActions } from '~c/components/ArchiveActions'
import { useArchiveStore } from '~c/stores/useArchiveStore'
import { trpc } from '~c/trpc'

interface GenericArchiveProps {
	feature: 'items' | 'contacts' | 'invoices'
	renderItem: (item: any) => React.ReactNode
}

export function GenericArchive({ feature, renderItem }: GenericArchiveProps) {
	const [search, setSearch] = useState('')
	const { setCounts } = useArchiveStore()
	const utils = trpc.useUtils()

	// Single query per feature - no redundant calls
	const query =
		feature === 'contacts'
			? trpc.contacts.list.useQuery({
					page: 1,
					limit: 1000,
					isActive: false
				})
			: feature === 'items'
			? trpc.items.list.useQuery({
					page: 1,
					limit: 1000,
					isActive: false
				})
			: trpc.invoices.list.useQuery({
					page: 1,
					limit: 1000,
					isActive: false
				})

	const toggleActiveMutation = trpc[feature].toggleActive.useMutation({
		onSuccess: () => {
			query.refetch()
			utils[feature].list.invalidate()
		}
	})

	const deleteMutation = trpc[feature].delete.useMutation({
		onSuccess: () => {
			query.refetch()
			utils[feature].list.invalidate()
		}
	})

	// Get items array from different formats
	const items =
		feature === 'contacts' 
			? (query.data as any)?.contacts || [] 
			: feature === 'items'
			? (query.data as any)?.items || []
			: (query.data as any)?.invoices || []

	// Update count when items change
	useEffect(() => {
		setCounts(feature, items.length)
	}, [items.length, feature, setCounts])

	const handleToggleActive = (id: string, currentlyActive: boolean) => {
		const action = currentlyActive ? 'Archiving' : 'Restoring'
		const actionPast = currentlyActive ? 'archived' : 'restored'

		toast.promise(toggleActiveMutation.mutateAsync({ id }), {
			loading: `${action}...`,
			success: `Successfully ${actionPast}`,
			error: `Could not ${action.toLowerCase()}`
		})
	}

	const handleDelete = (id: string, name: string) => {
		if (window.confirm(`Permanently delete "${name}"?`)) {
			toast.promise(deleteMutation.mutateAsync(id), {
				loading: 'Deleting...',
				success: 'Permanently deleted',
				error: 'Could not delete'
			})
		}
	}

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
									onDelete={() => handleDelete(item.id, item.name || item.company_name || item.invoice_number)}
									isActive={false}
									isToggling={toggleActiveMutation.isPending}
									isDeleting={deleteMutation.isPending}
								/>
							</Group>
						</Card>
					))}
				</Stack>
			</ScrollArea>
		</Stack>
	)
}
