import { AppShell, Burger, Group, ScrollArea, Text } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { Waves } from 'lucide-react'

function App() {
	const [opened, { toggle }] = useDisclosure()
	return (
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
					Navigation Here
				</AppShell.Section>
			</AppShell.Navbar>
			<AppShell.Main>Main</AppShell.Main>
		</AppShell>
	)
}

export default App
