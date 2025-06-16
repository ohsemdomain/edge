import type { InvoiceData } from './types'

// Helper functions for formatting
function formatCurrency(amount: number): string {
	return new Intl.NumberFormat('en-US', {
		style: 'currency',
		currency: 'USD'
	}).format(amount)
}

function formatDate(date: Date): string {
	return new Intl.DateTimeFormat('en-US', {
		year: 'numeric',
		month: 'long',
		day: 'numeric'
	}).format(date)
}

// Generate error page HTML
export function generateErrorPage(title: string, message: string): string {
	return `
		<!DOCTYPE html>
		<html>
		<head>
			<title>${title}</title>
			<style>
				body { 
					font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; 
					text-align: center; 
					padding: 3rem;
					background: #f5f5f5;
				}
				.error-container {
					background: white;
					padding: 2rem;
					border-radius: 8px;
					box-shadow: 0 2px 4px rgba(0,0,0,0.1);
					max-width: 400px;
					margin: 0 auto;
				}
				.error { color: #d32f2f; margin-bottom: 1rem; }
			</style>
		</head>
		<body>
			<div class="error-container">
				<h1 class="error">${title}</h1>
				<p>${message}</p>
			</div>
		</body>
		</html>
	`
}

// Generate complete invoice HTML
export function generateInvoiceHTML(invoice: InvoiceData): string {
	const itemsHtml = invoice.items.map((item) => `
		<tr>
			<td>${item.description}</td>
			<td class="text-center">${item.quantity}</td>
			<td class="text-right">${formatCurrency(item.unit_price)}</td>
			<td class="text-right">${formatCurrency(item.quantity * item.unit_price)}</td>
		</tr>
	`).join('')

	return `
<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>Invoice ${invoice.invoice_number}</title>
	<style>
		* {
			margin: 0;
			padding: 0;
			box-sizing: border-box;
		}
		body {
			font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
			line-height: 1.6;
			color: #333;
			background: #f5f5f5;
		}
		.container {
			max-width: 800px;
			margin: 2rem auto;
			padding: 0 1rem;
		}
		.invoice {
			background: white;
			padding: 2rem;
			border-radius: 8px;
			box-shadow: 0 2px 4px rgba(0,0,0,0.1);
		}
		.header {
			display: flex;
			justify-content: space-between;
			align-items: start;
			margin-bottom: 3rem;
			flex-wrap: wrap;
			gap: 1rem;
		}
		.invoice-title {
			font-size: 2rem;
			font-weight: 700;
			color: #1a1a1a;
			margin-bottom: 0.5rem;
		}
		.invoice-number {
			color: #666;
			font-size: 1.1rem;
		}
		.badge {
			display: inline-block;
			padding: 0.5rem 1rem;
			background: #e3f2fd;
			color: #1976d2;
			border-radius: 4px;
			font-weight: 600;
			text-transform: uppercase;
			font-size: 0.875rem;
		}
		.section {
			margin-bottom: 2rem;
		}
		.section-title {
			font-size: 1.1rem;
			font-weight: 600;
			margin-bottom: 1rem;
			color: #555;
		}
		.info-grid {
			display: grid;
			grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
			gap: 1rem;
		}
		.info-item label {
			display: block;
			color: #666;
			font-size: 0.875rem;
			margin-bottom: 0.25rem;
		}
		.info-item value {
			display: block;
			color: #1a1a1a;
			font-weight: 500;
		}
		table {
			width: 100%;
			border-collapse: collapse;
			margin-top: 1rem;
		}
		th, td {
			padding: 0.75rem;
			text-align: left;
			border-bottom: 1px solid #e0e0e0;
		}
		th {
			background: #f8f9fa;
			font-weight: 600;
			color: #555;
		}
		.text-center { text-align: center; }
		.text-right { text-align: right; }
		.total-row {
			font-weight: 700;
			font-size: 1.1rem;
			border-top: 2px solid #333;
		}
		.notes {
			background: #f8f9fa;
			padding: 1rem;
			border-radius: 4px;
			margin-top: 2rem;
		}
		.footer {
			margin-top: 3rem;
			padding-top: 2rem;
			border-top: 1px solid #e0e0e0;
			text-align: center;
			color: #666;
			font-size: 0.875rem;
		}
		@media print {
			body { background: white; }
			.container { margin: 0; }
			.invoice { box-shadow: none; padding: 1rem; }
		}
		@media (max-width: 600px) {
			.header { text-align: center; }
			.invoice { padding: 1rem; }
			table { font-size: 0.875rem; }
			th, td { padding: 0.5rem; }
		}
	</style>
</head>
<body>
	<div class="container">
		<div class="invoice">
			<div class="header">
				<div>
					<h1 class="invoice-title">Invoice</h1>
					<div class="invoice-number">${invoice.invoice_number}</div>
				</div>
				<div class="badge">Invoice</div>
			</div>

			<div class="section">
				<h2 class="section-title">Bill From</h2>
				<div>
					<strong>${invoice.contact_name}</strong>
					${invoice.contact_email ? `<br>${invoice.contact_email}` : ''}
					${invoice.contact_phone ? `<br>${invoice.contact_phone}` : ''}
				</div>
			</div>

			<div class="section">
				<div class="info-grid">
					<div class="info-item">
						<label>Invoice Date</label>
						<value>${formatDate(invoice.invoiceDate)}</value>
					</div>
					${invoice.dueDate ? `
					<div class="info-item">
						<label>Due Date</label>
						<value>${formatDate(invoice.dueDate)}</value>
					</div>
					` : ''}
					<div class="info-item">
						<label>Total Amount</label>
						<value style="font-size: 1.2rem; color: #1976d2;">${formatCurrency(invoice.total)}</value>
					</div>
				</div>
			</div>

			<div class="section">
				<h2 class="section-title">Items</h2>
				<table>
					<thead>
						<tr>
							<th>Description</th>
							<th class="text-center">Qty</th>
							<th class="text-right">Unit Price</th>
							<th class="text-right">Total</th>
						</tr>
					</thead>
					<tbody>
						${itemsHtml}
						<tr class="total-row">
							<td colspan="3" class="text-right">Total:</td>
							<td class="text-right">${formatCurrency(invoice.total)}</td>
						</tr>
					</tbody>
				</table>
			</div>

			${invoice.notes ? `
			<div class="notes">
				<h3 class="section-title">Notes</h3>
				<p>${invoice.notes}</p>
			</div>
			` : ''}

			<div class="footer">
				<p>Thank you for your business!</p>
				<p style="margin-top: 0.5rem; font-size: 0.75rem;">This invoice was generated electronically and is valid without signature.</p>
			</div>
		</div>
	</div>
</body>
</html>
	`
}