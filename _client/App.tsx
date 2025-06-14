import {
	ActionIcon,
	AppShell,
	Button,
	Group,
	NavLink,
	ScrollArea,
	Text,
	Title
} from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { httpBatchLink } from '@trpc/client'
import { Archive, Contact, LayoutDashboard, Logs, MoveLeft, ScanBarcode } from 'lucide-react'
import { Toaster } from 'react-hot-toast'
import { Link, Route, Routes, useLocation, useNavigate } from 'react-router-dom'

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
	const navigate = useNavigate()

	const navigation = [
		{ label: 'Dashboard', icon: LayoutDashboard, href: '/' },
		{ label: 'Items', icon: ScanBarcode, href: '/items' },
		{ label: 'Contacts', icon: Contact, href: '/contacts' },
		{ label: 'Archive', icon: Archive, href: '/archive' }
	]

	// Get current page title
	let currentPage =
		navigation.find((item) => item.href === location.pathname) ||
		(location.pathname.startsWith('/contacts/')
			? { label: 'Contacts' }
			: location.pathname.startsWith('/items/')
				? { label: 'Items' }
				: { label: 'Dashboard' })

	// Add prefix for new/edit routes
	const isFormPage = location.pathname.endsWith('/new') || location.pathname.includes('/edit/')
	if (location.pathname.endsWith('/new')) {
		const singularLabel = currentPage.label.replace('Contacts', 'Contact').replace('Items', 'Item')
		currentPage = { ...currentPage, label: `New ${singularLabel}` }
	} else if (location.pathname.includes('/edit/')) {
		const singularLabel = currentPage.label.replace('Contacts', 'Contact').replace('Items', 'Item')
		currentPage = { ...currentPage, label: `Edit ${singularLabel}` }
	}

	// Get base path for back navigation
	const getBasePath = () => {
		const pathParts = location.pathname.split('/')
		return `/${pathParts[1]}`
	}

	return (
		<trpc.Provider client={trpcClient} queryClient={queryClient}>
			<QueryClientProvider client={queryClient}>
				<AppShell
					withBorder={false}
					layout='alt'
					header={{ height: 70 }}
					navbar={{ width: 260, breakpoint: 'lg', collapsed: { mobile: !opened } }}
				>
					<AppShell.Header bg='gray.1'>
						<Group h='100%' px='md' justify='space-between'>
							<Group>
								<ActionIcon
									className='mantine-hidden-from-lg'
									onClick={toggle}
									variant='transparent'
									size='md'
								>
									<Logs size='xl' />
								</ActionIcon>
								{isFormPage && (
									<Button
										leftSection={<MoveLeft size={16} />}
										onClick={() => navigate(getBasePath())}
									>
										Back
									</Button>
								)}
								<Title order={3} fw={600}>
									{currentPage.label}
								</Title>
							</Group>
							<Group visibleFrom='lg'>
								<Text size='sm' c='dimmed'>
									User Name
								</Text>
								<Button bg='gray.4' c='gray.7'>
									Logout
								</Button>
							</Group>
						</Group>
					</AppShell.Header>
					<AppShell.Navbar bg='dark.9'>
						<AppShell.Section grow p='md' mt={20} component={ScrollArea} type='never'>
							{navigation.map((item) => (
								<NavLink
									key={item.href}
									component={Link}
									to={item.href}
									label={item.label}
									leftSection={<item.icon size={20} />}
									active={location.pathname.startsWith(item.href) && item.href !== '/'}
									onClick={toggle}
								/>
							))}
						</AppShell.Section>
					</AppShell.Navbar>
					<AppShell.Main
						bg='gray.0'
						style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}
					>
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
				<Toaster position='top-right' />
			</QueryClientProvider>
		</trpc.Provider>
	)
}

export default App
