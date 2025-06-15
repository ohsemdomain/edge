// _client/features/invoices/ContactSelector.tsx
import { ActionIcon, Button, Group, Loader, Paper, ScrollArea, Stack, Text, TextInput } from '@mantine/core'
import { useDebouncedValue } from '@mantine/hooks'
import { Plus, Search, User, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { trpc } from '~c/trpc'

interface Contact {
	id: string
	name: string
	company_name: string
	email?: string
	primary_phone: string
}

interface ContactSelectorProps {
	value: string
	onChange: (contactId: string) => void
	onAddContact: () => void
	placeholder?: string
	label?: string
	required?: boolean
	forceClose?: boolean // External prop to force close the dropdown
}

export function ContactSelector({ 
	value, 
	onChange, 
	onAddContact, 
	placeholder = "Search contacts...",
	label = "Customer",
	required = false,
	forceClose = false
}: ContactSelectorProps) {
	const [searchQuery, setSearchQuery] = useState('')
	const [isOpen, setIsOpen] = useState(false)
	const [debouncedSearch] = useDebouncedValue(searchQuery, 300)
	const inputRef = useRef<HTMLInputElement>(null)

	// Load contacts with debounced search - always enabled but cached
	const { data: contactsData, isLoading } = trpc.contacts.list.useQuery({
		search: debouncedSearch,
		page: 1,
		limit: 50,
		isActive: true
	}, {
		staleTime: 30000, // Cache for 30 seconds
		refetchOnWindowFocus: false
	})

	const contacts = contactsData?.contacts || []
	const selectedContact = contacts.find(c => c.id === value)

	// Sync external value changes with internal state
	useEffect(() => {
		if (!value) {
			// If value is cleared externally, clear internal state
			setSearchQuery('')
		} else if (selectedContact && !isOpen && searchQuery !== selectedContact.name) {
			// If value is set externally and we're not in edit mode, show the contact name
			setSearchQuery(selectedContact.name)
		}
	}, [value, selectedContact])

	// Handle external force close
	useEffect(() => {
		if (forceClose) {
			setIsOpen(false)
		}
	}, [forceClose])

	const handleSelectContact = (contact: Contact) => {
		onChange(contact.id)
		setSearchQuery(contact.name)
		setIsOpen(false)
		inputRef.current?.blur() // Remove focus after selection
	}

	const handleSearchFocus = () => {
		setIsOpen(true)
		if (selectedContact) {
			setSearchQuery('')
		}
	}

	const handleSearchChange = (query: string) => {
		setSearchQuery(query)
		if (!isOpen) setIsOpen(true)
	}

	const handleClear = () => {
		onChange('')
		setSearchQuery('')
		setIsOpen(false)
		inputRef.current?.blur() // Remove focus when clearing
	}

	const filteredContacts = searchQuery.length === 0 
		? contacts.slice(0, 10) // Show first 10 when no search
		: contacts.filter(contact =>
			contact.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
			contact.company_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
			(contact.email && contact.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
			contact.primary_phone?.includes(searchQuery)
		).slice(0, 10)

	// Display the selected contact name or search query
	const displayValue = selectedContact && !isOpen ? selectedContact.name : searchQuery

	return (
		<div style={{ position: 'relative' }}>
			<TextInput
				ref={inputRef}
				label={label}
				placeholder={placeholder}
				value={displayValue}
				onChange={(e) => handleSearchChange(e.target.value)}
				onFocus={handleSearchFocus}
				onBlur={() => {
					// Delay closing to allow for dropdown clicks
					setTimeout(() => setIsOpen(false), 150)
				}}
				leftSection={<Search size={16} />}
				rightSection={
					(selectedContact || searchQuery) ? (
						<ActionIcon
							variant='transparent'
							onClick={handleClear}
							size='sm'
						>
							<X size={16} />
						</ActionIcon>
					) : null
				}
				required={required}
				size='md'
			/>

			{isOpen && (
				<Paper
					shadow='md'
					withBorder
					style={{
						position: 'absolute',
						top: '100%',
						left: 0,
						right: 0,
						zIndex: 1000,
						maxHeight: 300,
						marginTop: 4
					}}
					onMouseDown={(e) => e.preventDefault()} // Prevent onBlur when clicking dropdown
				>
					<Stack gap={0}>
						{/* Add Contact Button */}
						<Button
							variant='light'
							leftSection={<Plus size={16} />}
							onClick={() => {
								setIsOpen(false) // Close dropdown first
								inputRef.current?.blur() // Remove focus from input
								onAddContact()
							}}
							style={{
								borderRadius: 0,
								borderBottom: '1px solid var(--mantine-color-gray-2)'
							}}
							fullWidth
							justify='flex-start'
						>
							Add New Contact
						</Button>

						{/* Loading State */}
						{isLoading && (
							<Group justify='center' p='md'>
								<Loader size='sm' />
								<Text size='sm' c='dimmed'>Searching...</Text>
							</Group>
						)}

						{/* Contact List */}
						{!isLoading && (
							<ScrollArea mah={240}>
								{/* Debug info */}
								{process.env.NODE_ENV === 'development' && (
									<Text size='xs' p='xs' c='dimmed'>
										Debug: {contacts.length} total, {filteredContacts.length} filtered, isOpen: {isOpen.toString()}
									</Text>
								)}
								
								{filteredContacts.length > 0 ? (
									filteredContacts.map((contact) => (
										<Button
											key={contact.id}
											variant='subtle'
											style={{
												borderRadius: 0,
												height: 'auto',
												padding: '12px 16px'
											}}
											fullWidth
											justify='flex-start'
											onClick={() => handleSelectContact(contact)}
										>
											<Group gap='sm' wrap='nowrap' w='100%'>
												<ActionIcon variant='light' size='sm'>
													<User size={14} />
												</ActionIcon>
												<div style={{ flex: 1, textAlign: 'left' }}>
													<Text size='sm' fw={500} truncate>
														{contact.name}
													</Text>
													<Group gap='xs'>
														{contact.email && (
															<Text size='xs' c='dimmed' truncate>
																{contact.email}
															</Text>
														)}
														<Text size='xs' c='dimmed'>
															{contact.primary_phone}
														</Text>
													</Group>
												</div>
											</Group>
										</Button>
									))
								) : (
									<Text size='sm' c='dimmed' p='md' ta='center'>
										{searchQuery ? 'No contacts found' : 'Click to see contacts'}
									</Text>
								)}
							</ScrollArea>
						)}
					</Stack>
				</Paper>
			)}
		</div>
	)
}