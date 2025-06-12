import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import path from 'node:path'
import { cloudflare } from '@cloudflare/vite-plugin'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
	plugins: [react(), tailwindcss(), cloudflare()],
	server: {
		port: 5090,
		watch: {
			ignored: ['**/.wrangler/**', '**/node_modules/**']
		}
	},
	resolve: {
		alias: {
			'@shared': path.resolve(__dirname, '-shared'),
			'@app': path.resolve(__dirname, '-app'),
			'@worker': path.resolve(__dirname, '-worker')
		}
	}
})
