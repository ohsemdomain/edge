import { ActionIcon, AppShell, Group, NavLink, ScrollArea, Text, Title } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { httpBatchLink } from '@trpc/client'
import { Archive, Contact, LayoutDashboard, ScanBarcode, SquareChevronRight, Waves } from 'lucide-react'
import { Toaster } from 'react-hot-toast'
import { Link, Route, Routes, useLocation } from 'react-router-dom'

import { ItemsPage } from './pages/ItemsPage'
import { ArchivePage } from './pages/archive/ArchivePage'
import { ContactFormPage } from './pages/contacts/ContactFormPage'
import { ContactsPage } from './pages/contacts/ContactsPage'
import { DashboardPage } from './pages/dashboard/DashboardPage'

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
				<AppShell
					layout='alt'
					header={{ height: 60 }}
					navbar={{ width: 260, breakpoint: 'lg', collapsed: { mobile: !opened } }}
					padding='md'
				>
					<AppShell.Header>
						<Group h='100%' px='md' justify='space-between'>
							<Group>
								<ActionIcon className='mantine-hidden-from-lg' onClick={toggle} variant='transparent' size='lg'>
									<SquareChevronRight size='xl' />
								</ActionIcon>
								<Title order={2} size='xl' fw={600}>
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
							<Route path='/contacts' element={<ContactsPage />} />
							<Route path='/contacts/new' element={<ContactFormPage mode='create' />} />
							<Route path='/contacts/edit/:id' element={<ContactFormPage mode='edit' />} />
							<Route path='/archive' element={<ArchivePage />} />
						</Routes>
					</AppShell.Main>
				</AppShell>
				<Toaster position='top-right' />
			</QueryClientProvider>
		</trpc.Provider>
	)
}

export default App
