// shared/invoices/database.ts

// Re-export the invoice tables from main schema
// (Note: The main schema is already using camelCase field names)
export { invoices, invoiceItems } from '../../_server/db/schema'

// Database row types
export type DbInvoice = {
  id: string
  contactId: string
  invoiceNumber: string
  invoiceDate: number
  dueDate: number | null
  notes: string | null
  createdAt: number
}

export type DbInvoiceItem = {
  id: string
  invoiceId: string
  itemId: string | null
  description: string
  quantity: number
  unitPrice: number
  createdAt: number
}