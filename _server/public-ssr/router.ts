import type { D1Database } from '@cloudflare/workers-types'
import { handleInvoiceSSR } from './invoice/handler'

export async function handleSSRRoute(pathname: string, db: D1Database): Promise<Response | null> {
	// Handle invoice sharing routes
	const invoiceMatch = pathname.match(/^\/share\/invoice\/([a-zA-Z0-9]+)$/)
	if (invoiceMatch) {
		const shareToken = invoiceMatch[1]
		return await handleInvoiceSSR(shareToken, db)
	}

	// Future: Handle quotation sharing routes
	// const quotationMatch = pathname.match(/^\/share\/quotation\/([a-zA-Z0-9]+)$/)
	// if (quotationMatch) {
	//   const shareToken = quotationMatch[1]
	//   return await handleQuotationSSR(shareToken, db)
	// }

	// Return null if no SSR route matches
	return null
}