import { Grid, Paper, ScrollArea, Stack, Text } from '@mantine/core'

export function DashboardPage() {
	const generateText = () => {
		const words = [
			'lorem',
			'ipsum',
			'dolor',
			'sit',
			'amet',
			'consectetur',
			'adipiscing',
			'elit',
			'sed',
			'do',
			'eiusmod',
			'tempor',
			'incididunt',
			'ut',
			'labore',
			'et',
			'dolore',
			'magna',
			'aliqua',
			'enim',
			'ad',
			'minim',
			'veniam',
			'quis',
			'nostrud',
			'exercitation',
			'ullamco',
			'laboris',
			'nisi',
			'aliquip',
			'ex',
			'ea',
			'commodo',
			'consequat',
			'duis',
			'aute',
			'irure',
			'in',
			'reprehenderit'
		]

		let text = ''
		while (text.length < 1000) {
			const wordCount = Math.floor(Math.random() * 10) + 5
			const sentence = Array(wordCount)
				.fill('')
				.map(() => words[Math.floor(Math.random() * words.length)])
				.join(' ')
			text += `${sentence.charAt(0).toUpperCase() + sentence.slice(1)}. `
		}
		return text
	}

	return (
		<ScrollArea h='100%' type='never'>
			<Stack p='md'>
				<Grid>
					<Grid.Col span={{ base: 12, lg: 6 }}>
						<Paper
							withBorder
							radius='md'
							p={20}
							h={300}
							style={{ display: 'flex', flexDirection: 'column' }}
						>
							<Text c='dimmed' size='sm'>
								Welcome to Edge
							</Text>
							<ScrollArea style={{ flex: 1 }} mt='md'>
								<Text>{generateText()}</Text>
							</ScrollArea>
						</Paper>
					</Grid.Col>
					<Grid.Col span={{ base: 12, lg: 6 }}>
						<Paper
							withBorder
							radius='md'
							p={20}
							h={300}
							style={{ display: 'flex', flexDirection: 'column' }}
						>
							<Text c='dimmed' size='sm'>
								Welcome to Edge
							</Text>
							<ScrollArea style={{ flex: 1 }} mt='md'>
								<Text>{generateText()}</Text>
							</ScrollArea>
						</Paper>
					</Grid.Col>
				</Grid>
				<Paper withBorder p={20}>
					<Text c='dimmed' size='sm'>
						Welcome to Edge
					</Text>
					<Text mt='md'>{generateText()}</Text>
				</Paper>
				<Paper withBorder p={20}>
					<Text c='dimmed' size='sm'>
						Welcome to Edge
					</Text>
					<Text mt='md'>{generateText()}</Text>
				</Paper>
			</Stack>
		</ScrollArea>
	)
}
