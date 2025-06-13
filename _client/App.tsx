import { AppShell, Burger, Group, NavLink, ScrollArea, Text } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { httpBatchLink } from '@trpc/client'
import { Archive, LayoutDashboard, ScanBarcode, Contact, Waves } from 'lucide-react'
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

	return (
		<trpc.Provider client={trpcClient} queryClient={queryClient}>
			<QueryClientProvider client={queryClient}>
				<AppShell
					layout='alt'
					header={{ height: 60 }}
					navbar={{ width: 260, breakpoint: 'lg', collapsed: { mobile: !opened } }}
					padding='md'
					className='font-roboto'
				>
					<AppShell.Header>
						<Group className='mantine-hidden-from-lg' h='100%' px='md'>
							<Burger opened={opened} onClick={toggle} size='sm' />
						</Group>
					</AppShell.Header>
					<AppShell.Navbar bg='dark.9' style={{withBorder:'false'}}>
						<AppShell.Section>
							<div className='flex items-center space-x-3 p-4'>
								<Waves color='white' className='h-7 w-7' />
								<Text fz={20} fw={600} c='white'>
									Edge
								</Text>
							</div>
						</AppShell.Section>
						<AppShell.Section grow p='md' component={ScrollArea}>
							{navigation.map((item) => (
								<NavLink
									key={item.href}
									component={Link}
									to={item.href}
									label={item.label}
									leftSection={<item.icon size={20} />}
									active={location.pathname === item.href}
								/>
							))}
						</AppShell.Section>
					</AppShell.Navbar>
					<AppShell.Main className='font-roboto'>
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
