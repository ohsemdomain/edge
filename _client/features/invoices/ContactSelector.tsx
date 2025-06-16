// _client/features/invoices/ContactSelector.tsx
import { Box, Paper, ScrollArea, Text, TextInput, UnstyledButton } from '@mantine/core'
import { useClickOutside } from '@mantine/hooks'
import { ChevronDown, Plus, Search } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { trpc } from '~c/trpc'
import { useInvoiceStore } from '../../stores/useInvoiceStore'

interface ContactSelectorProps {
	value: string
	onChange: (contactId: string) => void
	onAddContact: () => void
	placeholder?: string
	label?: string
	required?: boolean
	forceClose?: boolean
}

export function ContactSelector({
	value,
	onChange,
	onAddContact,
	placeholder = 'Select contact',
	label = 'Contact',
	required = false,
	forceClose = false
}: ContactSelectorProps) {
	const searchInputRef = useRef<HTMLInputElement>(null)

	// Get state and actions from Zustand
	const {
		contactSelectorSearch,
		contactSelectorDropdownOpen,
		allContacts,
		setContactSelectorSearch,
		setContactSelectorDropdownOpen,
		setAllContacts,
		toggleContactSelectorDropdown,
		selectContact
	} = useInvoiceStore()

	const dropdownRef = useClickOutside(() => setContactSelectorDropdownOpen(false))

	// Load all contacts once
	const { data: contactsData, isLoading } = trpc.contacts.list.useQuery(
		{
			isActive: true
		},
		{
			staleTime: 5 * 60 * 1000,
			refetchOnWindowFocus: false
		}
	)

	// Update store when contacts load
	useEffect(() => {
		if (contactsData?.contacts && contactsData.contacts.length > 0) {
			setAllContacts(contactsData.contacts)
		}
	}, [contactsData, setAllContacts])

	// Handle external force close
	useEffect(() => {
		if (forceClose) {
			setContactSelectorDropdownOpen(false)
		}
	}, [forceClose, setContactSelectorDropdownOpen])

	// Focus search input when dropdown opens
	useEffect(() => {
		if (contactSelectorDropdownOpen && searchInputRef.current) {
			searchInputRef.current.focus()
		}
	}, [contactSelectorDropdownOpen])

	const handleSelectContact = (contactId: string) => {
		selectContact(contactId)
		onChange(contactId)
	}

	// Use data from query if store is empty, otherwise use store
	const contactsToUse = allContacts.length > 0 ? allContacts : (contactsData?.contacts || [])
	const selectedContact = contactsToUse.find((c) => c.id === value)
	
	// Update store immediately if it's empty but we have query data
	useEffect(() => {
		if (allContacts.length === 0 && contactsData?.contacts && contactsData.contacts.length > 0) {
			setAllContacts(contactsData.contacts)
		}
	}, [allContacts.length, contactsData, setAllContacts])
	
	// Filter contacts based on search
	const filteredContacts =
		contactSelectorSearch.trim() === ''
			? contactsToUse
			: contactsToUse.filter((contact) => {
					const search = contactSelectorSearch.toLowerCase()
					return (
						contact.name?.toLowerCase().includes(search) ||
						contact.company_name?.toLowerCase().includes(search) ||
						contact.primary_phone?.includes(search)
					)
				})

	return (
		<Box style={{ position: 'relative' }}>
			{label && (
				<Text size='sm' fw={500} mb={4}>
					{label}
					{required && <span style={{ color: 'red' }}> *</span>}
				</Text>
			)}

			{/* Button-like input with chevron */}
			<UnstyledButton
				onClick={toggleContactSelectorDropdown}
				style={{
					width: '100%',
					padding: '8px 12px',
					border: '1px solid var(--mantine-color-gray-4)',
					borderRadius: '6px',
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'space-between',
					minHeight: '46px',
					backgroundColor: 'var(--mantine-color-white)',
					cursor: 'pointer'
				}}
			>
				<Text size='sm' c={selectedContact ? undefined : 'dimmed'}>
					{selectedContact ? selectedContact.name : placeholder}
				</Text>
				<ChevronDown size={18} style={{ flexShrink: 0 }} />
			</UnstyledButton>

			{/* Dropdown Panel */}
			{contactSelectorDropdownOpen && (
				<Paper
					ref={dropdownRef}
					shadow='md'
					radius='md'
					withBorder
					style={{
						position: 'absolute',
						top: '100%',
						left: 0,
						right: 0,
						zIndex: 1000,
						marginTop: 4,
						height: '400px',
						display: 'flex',
						flexDirection: 'column',
						overflow: 'hidden'
					}}
				>
					{/* Top Row - Search Input */}
					<Box p='sm'>
						<TextInput
							ref={searchInputRef}
							placeholder='Search contacts...'
							value={contactSelectorSearch}
							onChange={(e) => setContactSelectorSearch(e.target.value)}
							leftSection={<Search size={16} />}
							size='sm'
						/>
					</Box>

					{/* Middle Row - Contact List */}
					<Box style={{ flex: 1, overflow: 'hidden' }}>
						<ScrollArea h='100%' type='scroll'>
							{isLoading || (contactsToUse.length === 0) ? (
								<Text size='sm' c='dimmed' ta='center' p='xl'>
									Loading contacts...
								</Text>
							) : filteredContacts.length > 0 ? (
								<Box>
									{filteredContacts.map((contact) => (
										<UnstyledButton
											key={contact.id}
											onClick={() => handleSelectContact(contact.id)}
											style={{
												padding: '12px 16px',
												width: '100%',
												textAlign: 'left',
												borderBottom: '1px solid var(--mantine-color-gray-2)',
												display: 'block'
											}}
											onMouseEnter={(e) => {
												e.currentTarget.style.backgroundColor = 'var(--mantine-color-gray-0)'
											}}
											onMouseLeave={(e) => {
												e.currentTarget.style.backgroundColor = 'transparent'
											}}
										>
											<Text size='sm' fw={500} tt="uppercase">
												{contact.company_name}
											</Text>
											<Text size='xs' c='dimmed'>
												{contact.primary_phone}
											</Text>
										</UnstyledButton>
									))}
								</Box>
							) : (
								<Text size='sm' c='dimmed' ta='center' p='xl'>
									No contacts found
								</Text>
							)}
						</ScrollArea>
					</Box>

					{/* Bottom Row - New Customer Button */}
					<UnstyledButton
						onClick={() => {
							setContactSelectorDropdownOpen(false)
							onAddContact()
						}}
						style={{
							display: 'flex',
							alignItems: 'center',
							gap: '12px',
							padding: '16px',
							borderTop: '1px solid var(--mantine-color-gray-3)',
							backgroundColor: 'transparent',
							width: '100%',
							cursor: 'pointer',
							transition: 'background-color 0.1s'
						}}
						onMouseEnter={(e) => {
							e.currentTarget.style.backgroundColor = 'var(--mantine-color-gray-0)'
						}}
						onMouseLeave={(e) => {
							e.currentTarget.style.backgroundColor = 'transparent'
						}}
					>
						<Box
							style={{
								width: '20px',
								height: '20px',
								backgroundColor: 'var(--mantine-color-blue-6)',
								borderRadius: '4px',
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
								flexShrink: 0
							}}
						>
							<Plus size={16} color='white' />
						</Box>
						<Text c='blue.5' size='sm' fw={500}>
							New Contact
						</Text>
					</UnstyledButton>
				</Paper>
			)}
		</Box>
	)
}
