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
import { Archive, Contact, FileText, LayoutDashboard, Logs, ScanBarcode, CreditCard } from 'lucide-react'
import React from 'react'
import { Toaster } from 'react-hot-toast'
import { Link, Route, Routes, useLocation } from 'react-router-dom'

import { ArchivePage } from './features/archive/ArchivePage'
import { ContactFormPage } from './features/contacts/ContactFormPage'
import { ContactsPage } from './features/contacts/ContactsPage'
import { DashboardPage } from './features/dashboard/DashboardPage'
import { InvoiceFormPage } from './features/invoices/InvoiceFormPage'
import { InvoicesPage } from './features/invoices/InvoicesPage'
import { ItemFormPage } from './features/items/ItemFormPage'
import { ItemsPage } from './features/items/ItemsPage'
import { PaymentFormPage } from './features/payments/PaymentFormPage'
import { PaymentsPage } from './features/payments/PaymentsPage'

import { trpc } from './trpc'

const queryClient = new QueryClient()
const trpcClient = trpc.createClient({
	links: [
		httpBatchLink({
			url: '/trpc'
		})
	]
})

// Route configuration
const routeConfig = [
	{
		path: '/',
		label: 'Dashboard',
		icon: LayoutDashboard,
		element: <DashboardPage />
	},
	{
		path: '/items',
		label: 'Items',
		singular: 'Item',
		icon: ScanBarcode,
		element: <ItemsPage />,
		subroutes: [
			{ path: '/items/new', element: <ItemFormPage mode='create' /> },
			{ path: '/items/edit/:id', element: <ItemFormPage mode='edit' /> }
		]
	},
	{
		path: '/contacts',
		label: 'Contacts',
		singular: 'Contact',
		icon: Contact,
		element: <ContactsPage />,
		subroutes: [
			{ path: '/contacts/new', element: <ContactFormPage mode='create' /> },
			{ path: '/contacts/edit/:id', element: <ContactFormPage mode='edit' /> }
		]
	},
	{
		path: '/invoices',
		label: 'Invoices',
		singular: 'Invoice',
		icon: FileText,
		element: <InvoicesPage />,
		subroutes: [
			{ path: '/invoices/new', element: <InvoiceFormPage mode='create' /> },
			{ path: '/invoices/edit/:id', element: <InvoiceFormPage mode='edit' /> }
		]
	},
	{
		path: '/payments',
		label: 'Payments',
		singular: 'Payment',
		icon: CreditCard,
		element: <PaymentsPage />,
		subroutes: [
			{ path: '/payments/new', element: <PaymentFormPage mode='create' /> },
			{ path: '/payments/edit/:id', element: <PaymentFormPage mode='edit' /> }
		]
	},
	{
		path: '/archive',
		label: 'Archive',
		icon: Archive,
		element: <ArchivePage />
	}
]

function App() {
	const [opened, { toggle }] = useDisclosure()
	const location = useLocation()

	// Get current page title
	const getPageTitle = () => {
		const path = location.pathname

		// Find matching route
		const route = routeConfig.find((r) => path === r.path || path.startsWith(`${r.path}/`))

		if (!route) return 'Dashboard'

		// Handle subroutes
		if (path.endsWith('/new')) {
			return `New ${route.singular || route.label.slice(0, -1)}`
		}
		if (path.includes('/edit/')) {
			return `Edit ${route.singular || route.label.slice(0, -1)}`
		}

		return route.label
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
								<Title order={3} fw={600}>
									{getPageTitle()}
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
							{routeConfig.map((item) => (
								<NavLink
									key={item.path}
									component={Link}
									to={item.path}
									label={item.label}
									leftSection={<item.icon size={20} />}
									active={
										item.path === '/'
											? location.pathname === '/'
											: location.pathname.startsWith(item.path)
									}
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
							{routeConfig.map((route) => (
								<React.Fragment key={route.path}>
									<Route path={route.path} element={route.element} />
									{route.subroutes?.map((subroute) => (
										<Route key={subroute.path} path={subroute.path} element={subroute.element} />
									))}
								</React.Fragment>
							))}
						</Routes>
					</AppShell.Main>
				</AppShell>
				<Toaster position='top-right' />
			</QueryClientProvider>
		</trpc.Provider>
	)
}

export default App
