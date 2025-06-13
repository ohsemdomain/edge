import { fetchRequestHandler } from '@trpc/server/adapters/fetch'
import { contactsRouter } from './routes/contacts'
import { itemsRouter } from './routes/items'
import { createContext, router } from './trpc'

// Combine all routers
export const appRouter = router({
	items: itemsRouter,
	contacts: contactsRouter
})

export type AppRouter = typeof appRouter

export default {
	async fetch(request: Request): Promise<Response> {
		// Handle tRPC requests
		if (request.url.includes('/trpc')) {
			return fetchRequestHandler({
				endpoint: '/trpc',
				req: request,
				router: appRouter,
				createContext
			})
		}

		// Your existing response
		return new Response('Hello World!', {
			headers: { 'Content-Type': 'text/plain' }
		})
	}
}
