import { AppShell, Burger, Group, NavLink, ScrollArea, Text } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { httpBatchLink } from '@trpc/client'
import { Package, Users, Waves } from 'lucide-react'
import { Toaster } from 'react-hot-toast'
import { Link, Route, Routes, useLocation } from 'react-router-dom'
import { ItemsPage } from './pages/ItemsPage'
import { ContactFormPage } from './pages/contacts/ContactFormPage'
import { ContactsPage } from './pages/contacts/ContactsPage'
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
		{ label: 'Items', icon: Package, href: '/' },
		{ label: 'Contacts', icon: Users, href: '/contacts' }
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
					<AppShell.Navbar bg='dark.9'>
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
									color='white'
									variant='subtle'
									className='mb-1'
									styles={{
										root: { borderRadius: '8px' },
										label: { color: 'white' }
									}}
								/>
							))}
						</AppShell.Section>
					</AppShell.Navbar>
					<AppShell.Main>
						<Routes>
							<Route path='/' element={<ItemsPage />} />
							<Route path='/contacts' element={<ContactsPage />} />
							<Route path='/contacts/new' element={<ContactFormPage mode='create' />} />
							<Route path='/contacts/edit/:id' element={<ContactFormPage mode='edit' />} />
						</Routes>
					</AppShell.Main>
				</AppShell>
				<Toaster position='top-right' />
			</QueryClientProvider>
		</trpc.Provider>
	)
}

export default App
