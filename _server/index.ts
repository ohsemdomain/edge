// _server/index.ts
import type { D1Database, KVNamespace, R2Bucket } from '@cloudflare/workers-types'
import { fetchRequestHandler } from '@trpc/server/adapters/fetch'
import { contactsRouter } from './routes/contacts'
import { itemsRouter } from './routes/items'
import { createContext, router } from './trpc'

// Define Env interface here where it's used
export interface Env {
	DB: D1Database
	KV: KVNamespace
	R2: R2Bucket
}

// Combine all routers
export const appRouter = router({
	items: itemsRouter,
	contacts: contactsRouter
})

export type AppRouter = typeof appRouter

export default {
	async fetch(request: Request, env: Env): Promise<Response> {
		// Handle tRPC requests
		if (request.url.includes('/trpc')) {
			return fetchRequestHandler({
				endpoint: '/trpc',
				req: request,
				router: appRouter,
				createContext: () => createContext(env)
			})
		}

		// Your existing response
		return new Response('Hello World!', {
			headers: { 'Content-Type': 'text/plain' }
		})
	}
}
