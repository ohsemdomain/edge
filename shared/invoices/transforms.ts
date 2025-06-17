// shared/invoices/transforms.ts
import type { DbInvoice, DbInvoiceItem } from './database'
import type { Invoice, InvoiceItem, InvoiceWithRelations } from './api'

// Transform database invoice row to API format
export function toApiInvoice(dbInvoice: DbInvoice): Invoice {
  return {
    id: dbInvoice.id,
    contactId: dbInvoice.contactId,
    invoiceNumber: dbInvoice.invoiceNumber,
    invoiceDate: dbInvoice.invoiceDate,
    dueDate: dbInvoice.dueDate,
    notes: dbInvoice.notes,
    isActive: dbInvoice.isActive,
    createdAt: dbInvoice.createdAt
  }
}

// Transform database invoice item row to API format
export function toApiInvoiceItem(dbInvoiceItem: DbInvoiceItem): InvoiceItem {
  return {
    id: dbInvoiceItem.id,
    invoiceId: dbInvoiceItem.invoiceId,
    itemId: dbInvoiceItem.itemId,
    description: dbInvoiceItem.description,
    quantity: dbInvoiceItem.quantity,
    unitPrice: dbInvoiceItem.unitPrice,
    createdAt: dbInvoiceItem.createdAt
  }
}

// Transform array of database invoice rows to API format
export function toApiInvoices(dbInvoices: DbInvoice[]): Invoice[] {
  return dbInvoices.map(toApiInvoice)
}

// Transform array of database invoice item rows to API format
export function toApiInvoiceItems(dbInvoiceItems: DbInvoiceItem[]): InvoiceItem[] {
  return dbInvoiceItems.map(toApiInvoiceItem)
}

// Transform database invoice with relations to API format with relations
export function toApiInvoiceWithRelations(
  dbInvoice: DbInvoice,
  relations: {
    contactName: string
    contactEmail: string
    contactPhone: string
    total: number
    balance: number
    items: (InvoiceItem & { itemName?: string | null })[]
    payments: { id?: string; amount: number; paymentDate?: number; paymentMethod?: string; notes?: string }[]
    contact: {
      id: string
      companyName: string
      email: string | null
      primaryPhone: string
      isActive: boolean
    } | null
  }
): InvoiceWithRelations {
  return {
    ...toApiInvoice(dbInvoice),
    contactName: relations.contactName,
    contactEmail: relations.contactEmail,
    contactPhone: relations.contactPhone,
    total: relations.total,
    balance: relations.balance,
    items: relations.items,
    payments: relations.payments,
    contact: relations.contact
  }
}