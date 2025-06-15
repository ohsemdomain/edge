import toast from 'react-hot-toast'
// _client/hooks/useArchive.ts
import { trpc } from '~c/trpc'

export function useArchiveActions(feature: 'items' | 'contacts', refetch: () => void) {
	const utils = trpc.useUtils()

	const toggleActiveMutation = trpc[feature].toggleActive.useMutation({
		onSuccess: () => {
			refetch()
			utils[feature].list.invalidate()
		}
	})

	const deleteMutation = trpc[feature].delete.useMutation({
		onSuccess: () => {
			refetch()
			utils[feature].list.invalidate()
		}
	})

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

	return {
		handleToggleActive,
		handleDelete,
		isToggling: toggleActiveMutation.isPending,
		isDeleting: deleteMutation.isPending
	}
}
