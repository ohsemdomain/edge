import path from 'node:path'
import { cloudflare } from '@cloudflare/vite-plugin'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react-swc'
import { defineConfig } from 'vite'

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
			'~c': path.resolve(__dirname, '_client'),
			'~s': path.resolve(__dirname, '_server')
		}
	},
	build: {
		chunkSizeWarningLimit: 600
	}
})
