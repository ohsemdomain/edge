import { ActionIcon, Button, Group, TextInput, Tooltip } from '@mantine/core'
import { Copy, ExternalLink, Share } from 'lucide-react'
import { useState } from 'react'
import toast from 'react-hot-toast'

interface CustomLinkProps {
	url: string
	label?: string
	variant?: 'button' | 'input' | 'icon'
	size?: 'xs' | 'sm' | 'md' | 'lg'
	showExternalIcon?: boolean
}

export function CustomLink({ 
	url, 
	label = 'Share Link',
	variant = 'button',
	size = 'sm',
	showExternalIcon = true 
}: CustomLinkProps) {
	const [copied, setCopied] = useState(false)

	const handleCopy = async () => {
		try {
			await navigator.clipboard.writeText(url)
			setCopied(true)
			toast.success('Link copied to clipboard!')
			
			// Reset copied state after 2 seconds
			setTimeout(() => setCopied(false), 2000)
		} catch (_error) {
			toast.error('Failed to copy link')
		}
	}

	const handleOpen = () => {
		window.open(url, '_blank', 'noopener,noreferrer')
	}

	if (variant === 'input') {
		return (
			<Group gap="xs" style={{ flex: 1 }}>
				<TextInput
					value={url}
					readOnly
					placeholder="Share link"
					style={{ flex: 1 }}
					size={size}
				/>
				<Tooltip label={copied ? 'Copied!' : 'Copy link'} withArrow>
					<ActionIcon
						variant="light"
						onClick={handleCopy}
						size={size === 'xs' ? 28 : size === 'sm' ? 32 : size === 'md' ? 36 : 42}
						color={copied ? 'green' : 'gray'}
					>
						<Copy size={size === 'xs' ? 12 : size === 'sm' ? 14 : size === 'md' ? 16 : 18} />
					</ActionIcon>
				</Tooltip>
				{showExternalIcon && (
					<Tooltip label="Open in new tab" withArrow>
						<ActionIcon
							variant="light"
							onClick={handleOpen}
							size={size === 'xs' ? 28 : size === 'sm' ? 32 : size === 'md' ? 36 : 42}
						>
							<ExternalLink size={size === 'xs' ? 12 : size === 'sm' ? 14 : size === 'md' ? 16 : 18} />
						</ActionIcon>
					</Tooltip>
				)}
			</Group>
		)
	}

	if (variant === 'icon') {
		return (
			<Group gap="xs">
				<Tooltip label={copied ? 'Copied!' : 'Copy share link'} withArrow>
					<ActionIcon
						variant="light"
						onClick={handleCopy}
						size={size === 'xs' ? 28 : size === 'sm' ? 32 : size === 'md' ? 36 : 42}
						color={copied ? 'green' : 'blue'}
					>
						<Share size={size === 'xs' ? 12 : size === 'sm' ? 14 : size === 'md' ? 16 : 18} />
					</ActionIcon>
				</Tooltip>
				{showExternalIcon && (
					<Tooltip label="Open in new tab" withArrow>
						<ActionIcon
							variant="light"
							onClick={handleOpen}
							size={size === 'xs' ? 28 : size === 'sm' ? 32 : size === 'md' ? 36 : 42}
						>
							<ExternalLink size={size === 'xs' ? 12 : size === 'sm' ? 14 : size === 'md' ? 16 : 18} />
						</ActionIcon>
					</Tooltip>
				)}
			</Group>
		)
	}

	// Default button variant
	return (
		<Group gap="xs">
			<Button
				variant="outline"
				size={size}
				leftSection={<Share size={16} />}
				onClick={handleCopy}
				color={copied ? 'green' : undefined}
			>
				{copied ? 'Copied!' : label}
			</Button>
			{showExternalIcon && (
				<Tooltip label="Open in new tab" withArrow>
					<ActionIcon
						variant="light"
						onClick={handleOpen}
						size={size === 'xs' ? 28 : size === 'sm' ? 32 : size === 'md' ? 36 : 42}
					>
						<ExternalLink size={size === 'xs' ? 12 : size === 'sm' ? 14 : size === 'md' ? 16 : 18} />
					</ActionIcon>
				</Tooltip>
			)}
		</Group>
	)
}