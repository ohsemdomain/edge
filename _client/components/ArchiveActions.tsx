// _client/components/ArchiveActions.tsx
import { ActionIcon, Group, Tooltip } from '@mantine/core'
import { Archive, CheckCircle, Trash } from 'lucide-react'

interface ArchiveActionsProps {
	onToggleActive: () => void
	onDelete: () => void
	isActive: boolean
	isToggling?: boolean
	isDeleting?: boolean
}

export function ArchiveActions({
	onToggleActive,
	onDelete,
	isActive,
	isToggling,
	isDeleting
}: ArchiveActionsProps) {
	return (
		<Group>
			<Tooltip label={isActive ? 'Move to Archive' : 'Restore'} withArrow>
				<ActionIcon
					variant='light'
					size='md'
					onClick={onToggleActive}
					disabled={isToggling}
					aria-label={isActive ? 'Archive' : 'Restore'}
				>
					{isActive ? <Archive size={14} /> : <CheckCircle size={14} />}
				</ActionIcon>
			</Tooltip>

			{!isActive && (
				<Tooltip label='Delete Permanently' withArrow>
					<ActionIcon
						variant='light'
						color='red'
						size='md'
						onClick={onDelete}
						disabled={isDeleting}
						aria-label='Delete'
					>
						<Trash size={14} />
					</ActionIcon>
				</Tooltip>
			)}
		</Group>
	)
}
