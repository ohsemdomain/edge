import { AppShell, Burger, Group, ScrollArea, Skeleton } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { Target } from 'lucide-react'

function App() {
	const [opened, { toggle }] = useDisclosure()
	return (
		<AppShell
			layout='alt'
			header={{ height: 60 }}
			navbar={{ width: 300, breakpoint: 'lg', collapsed: { mobile: !opened } }}
			padding='md'
			className='font-roboto'
		>
			<AppShell.Header>
				<Group className='mantine-hidden-from-lg' h='100%' px='md'>
					<Burger opened={opened} onClick={toggle} size='sm' />
					<div className='flex items-center space-x-2'>
						<Target color='blue' className='h-5 w-5' />
						<span color='blue' className='font-bold'>
							EDGE
						</span>
					</div>
				</Group>
			</AppShell.Header>
			<AppShell.Navbar p='md'>
				<AppShell.Section>
					<div className='flex items-center space-x-2'>
						<Target color='blue' className='h-5 w-5' />
						<span color='blue' className='font-bold'>
							EDGE
						</span>
					</div>
				</AppShell.Section>
				<AppShell.Section grow my='md' component={ScrollArea}>
					60 links in a scrollable section
					{Array(60)
						.fill(0)
						.map((_, index) => (
							<Skeleton key={index} h={28} mt='sm' animate={false} />
						))}
				</AppShell.Section>
				<AppShell.Section>Navbar footer – always at the bottom</AppShell.Section>
			</AppShell.Navbar>
			<AppShell.Main>Main</AppShell.Main>
		</AppShell>
	)
}

export default App
