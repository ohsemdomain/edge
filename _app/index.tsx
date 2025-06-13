import { MantineProvider } from '@mantine/core'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import '@mantine/core/styles.css'
import { theme } from './_theme'
import './_index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
	<StrictMode>
		<MantineProvider theme={theme}>
			<HashRouter>
				<App />
			</HashRouter>
		</MantineProvider>
	</StrictMode>
)
