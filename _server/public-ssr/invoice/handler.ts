import type { D1Database } from '@cloudflare/workers-types'
import { getInvoiceByShareToken } from './data-fetcher'
import { generateInvoiceHTML, generateErrorPage } from './html-template'

export async function handleInvoiceSSR(shareToken: string, db: D1Database): Promise<Response> {
	try {
		// Get invoice data using the data fetcher
		const invoiceData = await getInvoiceByShareToken(shareToken, db)
		
		if (!invoiceData) {
			return new Response(generateErrorPage('Invoice Not Found', 'This invoice link is invalid or has expired.'), {
				status: 404,
				headers: { 'Content-Type': 'text/html' }
			})
		}

		// Generate and return HTML
		return new Response(generateInvoiceHTML(invoiceData), {
			headers: { 
				'Content-Type': 'text/html',
				'Cache-Control': 'no-cache'
			}
		})
	} catch (error) {
		console.error('Error fetching invoice:', error)
		return new Response(generateErrorPage('Error', 'An error occurred while loading the invoice.'), {
			status: 500,
			headers: { 'Content-Type': 'text/html' }
		})
	}
}