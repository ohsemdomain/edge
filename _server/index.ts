// _server/index.ts
import type {
	Request as CFRequest,
	D1Database,
	Fetcher,
	KVNamespace,
	R2Bucket
} from '@cloudflare/workers-types'
import { fetchRequestHandler } from '@trpc/server/adapters/fetch'
import { contactsRouter } from './routes/contacts'
import { invoicesRouter } from './routes/invoices'
import { itemsRouter } from './routes/items'
import { paymentsRouter } from './routes/payments'
import { createContext, router } from './trpc'

// Environment interface
export interface Env {
	DB: D1Database
	KV: KVNamespace
	R2: R2Bucket
	ASSETS: Fetcher
}

// Combine all routers
export const appRouter = router({
	items: itemsRouter,
	contacts: contactsRouter,
	invoices: invoicesRouter,
	payments: paymentsRouter
})

export type AppRouter = typeof appRouter

export default {
	async fetch(request: CFRequest, env: Env) {
		const url = new URL(request.url)

		// Handle tRPC API requests
		if (url.pathname.startsWith('/trpc')) {
			return fetchRequestHandler({
				endpoint: '/trpc',
				req: request as unknown as Request,
				router: appRouter,
				createContext: () => createContext(env)
			})
		}

		// Serve static assets for everything else
		return env.ASSETS.fetch(request)
	}
}
