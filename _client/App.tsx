import { ActionIcon, AppShell, Group, NavLink, ScrollArea, Title } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { httpBatchLink } from '@trpc/client'
import { Archive, Contact, LayoutDashboard, ScanBarcode, SquareChevronRight } from 'lucide-react'
import { Toaster } from 'react-hot-toast'
import { Link, Route, Routes, useLocation } from 'react-router-dom'

import { ArchivePage } from './features/archive/ArchivePage'
import { ContactFormPage } from './features/contacts/ContactFormPage'
import { ContactsPage } from './features/contacts/ContactsPage'
import { DashboardPage } from './features/dashboard/DashboardPage'
import { ItemFormPage } from './features/items/ItemFormPage'
import { ItemsPage } from './features/items/ItemsPage'

import { trpc } from './utils/trpc'

const queryClient = new QueryClient()
const trpcClient = trpc.createClient({
	links: [
		httpBatchLink({
			url: '/trpc'
		})
	]
})

function App() {
	const [opened, { toggle }] = useDisclosure()
	const location = useLocation()

	const navigation = [
		{ label: 'Dashboard', icon: LayoutDashboard, href: '/' },
		{ label: 'Items', icon: ScanBarcode, href: '/items' },
		{ label: 'Contacts', icon: Contact, href: '/contacts' },
		{ label: 'Archive', icon: Archive, href: '/archive' }
	]

	// Get current page title
	const currentPage =
		navigation.find((item) => item.href === location.pathname) ||
		(location.pathname.startsWith('/contacts/') ? { label: 'Contacts' } : { label: 'Dashboard' })

	return (
		<trpc.Provider client={trpcClient} queryClient={queryClient}>
			<QueryClientProvider client={queryClient}>
				<AppShell layout='alt' header={{ height: 60 }} navbar={{ width: 260, breakpoint: 'lg', collapsed: { mobile: !opened } }} padding='md'>
					<AppShell.Header>
						<Group h='100%' px='md' justify='space-between'>
							<Group>
								<ActionIcon className='mantine-hidden-from-lg' onClick={toggle} variant='transparent' size='lg'>
									<SquareChevronRight size='xl' />
								</ActionIcon>
								<Title order={3} fw={600}>
									{currentPage.label}
								</Title>
							</Group>
						</Group>
					</AppShell.Header>
					<AppShell.Navbar bg='dark.9' style={{ withBorder: 'false' }}>
						<AppShell.Section grow p='md' component={ScrollArea}>
							{navigation.map((item) => (
								<NavLink
									key={item.href}
									component={Link}
									to={item.href}
									label={item.label}
									leftSection={<item.icon size={20} />}
									active={location.pathname === item.href}
									onClick={toggle}
								/>
							))}
						</AppShell.Section>
					</AppShell.Navbar>
					<AppShell.Main>
						<Routes>
							<Route path='/' element={<DashboardPage />} />
							<Route path='/items' element={<ItemsPage />} />
							<Route path='/items/new' element={<ItemFormPage mode='create' />} />
							<Route path='/items/edit/:id' element={<ItemFormPage mode='edit' />} />
							<Route path='/contacts' element={<ContactsPage />} />
							<Route path='/contacts/new' element={<ContactFormPage mode='create' />} />
							<Route path='/contacts/edit/:id' element={<ContactFormPage mode='edit' />} />
							<Route path='/archive' element={<ArchivePage />} />
						</Routes>
					</AppShell.Main>
				</AppShell>
				<Toaster position='top-center' />
			</QueryClientProvider>
		</trpc.Provider>
	)
}

export default App
