import type { D1Database } from '@cloudflare/workers-types'

// Helper function to generate share token
function generateShareTokenString(): string {
	return crypto.randomUUID().replace(/-/g, '').slice(0, 16)
}

// Generate or retrieve share token for an invoice
export async function generateShareToken(invoiceId: string, db: D1Database): Promise<{ shareToken: string }> {
	// Check if invoice already has a share token
	const { results: existing } = await db.prepare(`
		SELECT share_token FROM invoices WHERE id = ?
	`)
		.bind(invoiceId)
		.all<{ share_token: string | null }>()

	if (existing.length === 0) {
		throw new Error('Invoice not found')
	}

	let shareToken = existing[0].share_token

	// Generate new token if doesn't exist
	if (!shareToken) {
		shareToken = generateShareTokenString()
		
		// Update invoice with share token
		await db.prepare(`
			UPDATE invoices SET share_token = ? WHERE id = ?
		`)
			.bind(shareToken, invoiceId)
			.run()
	}

	return { shareToken }
}

// Generate share token for new invoice creation
export function generateNewShareToken(): string {
	return generateShareTokenString()
}