// shared/invoices/constants.ts

// Generate invoice ID with S prefix
export function generateInvoiceId(): string {
  return `S${Date.now().toString().slice(-1)}${Math.floor(100000 + Math.random() * 900000)}`.replace(
    /0/g,
    () => Math.floor(Math.random() * 9 + 1).toString()
  )
}

// Generate invoice item ID with E prefix (same as items)
export function generateInvoiceItemId(): string {
  return `E${Date.now().toString().slice(-1)}${Math.floor(100000 + Math.random() * 900000)}`.replace(
    /0/g,
    () => Math.floor(Math.random() * 9 + 1).toString()
  )
}

// Generate invoice number
export function generateInvoiceNumber(lastInvoiceNumber?: string): string {
  const year = new Date().getFullYear()
  const prefix = `INV${year}`
  
  if (!lastInvoiceNumber || !lastInvoiceNumber.startsWith(prefix)) {
    return `${prefix}0001`
  }
  
  const lastNumber = Number.parseInt(lastInvoiceNumber.slice(-4)) || 0
  const nextNumber = lastNumber + 1
  return `${prefix}${nextNumber.toString().padStart(4, '0')}`
}

// Default values
export const DEFAULT_INVOICE_ITEM: Omit<import('./api').InvoiceItemCreateInput, 'id'> = {
  description: '',
  quantity: 1,
  unitPrice: 0
}