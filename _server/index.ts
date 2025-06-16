// _server/index.ts
import type { D1Database, KVNamespace, R2Bucket } from '@cloudflare/workers-types'
import { fetchRequestHandler } from '@trpc/server/adapters/fetch'
import { contactsRouter } from './routes/contacts'
import { itemsRouter } from './routes/items'
import { invoicesRouter } from './routes/invoices'
import { createContext, router } from './trpc'
import { handleSSRRoute } from './public-ssr/router'

// Define Env interface here where it's used
export interface Env {
	DB: D1Database
	KV: KVNamespace
	R2: R2Bucket
	ASSETS: { fetch: (request: Request) => Promise<Response> }
}

// Combine all routers
export const appRouter = router({
	items: itemsRouter,
	contacts: contactsRouter,
	invoices: invoicesRouter
})

export type AppRouter = typeof appRouter

export default {
	async fetch(request: Request, env: Env): Promise<Response> {
		const url = new URL(request.url)
		
		// Handle SSR routes (invoices, quotations, etc.) - HIGHEST PRIORITY
		const ssrResponse = await handleSSRRoute(url.pathname, env.DB)
		if (ssrResponse) {
			return ssrResponse
		}

		// Handle tRPC requests
		if (request.url.includes('/trpc')) {
			return fetchRequestHandler({
				endpoint: '/trpc',
				req: request,
				router: appRouter,
				createContext: () => createContext(env)
			})
		}

		// Handle static assets (JS, CSS, images, etc.)
		if (url.pathname.startsWith('/assets/') || 
			url.pathname.endsWith('.js') || 
			url.pathname.endsWith('.css') || 
			url.pathname.endsWith('.ico') || 
			url.pathname.endsWith('.svg') || 
			url.pathname.endsWith('.png') ||
			url.pathname.includes('/_client/')) {
			// Let Cloudflare handle static assets from /dist
			return env.ASSETS.fetch(request)
		}

		// For all other routes, serve the React SPA
		// This handles client-side routing for the main app
		try {
			// Try to get index.html from assets
			const indexRequest = new Request(new URL('/index.html', request.url), request)
			return env.ASSETS.fetch(indexRequest)
		} catch (error) {
			// Fallback if assets not available
			return new Response(`
				<!DOCTYPE html>
				<html>
				<head>
					<title>App Loading...</title>
				</head>
				<body>
					<div id="root">Loading...</div>
					<script>window.location.reload()</script>
				</body>
				</html>
			`, {
				headers: { 'Content-Type': 'text/html' }
			})
		}
	}
}
