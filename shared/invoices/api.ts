// shared/invoices/api.ts

// Core Invoice Item type in camelCase (matches API responses)
export interface InvoiceItem {
  id: string
  invoiceId: string
  itemId: string | null  // Reference to items table
  description: string
  quantity: number
  unitPrice: number
  createdAt: number  // Unix timestamp in seconds
}

// Core Invoice type in camelCase (matches API responses)
export interface Invoice {
  id: string
  contactId: string
  invoiceNumber: string
  invoiceDate: number  // Unix timestamp in seconds
  dueDate: number | null  // Unix timestamp in seconds
  notes: string | null
  createdAt: number  // Unix timestamp in seconds
}

// Invoice with related data for list/detail views
export interface InvoiceWithRelations {
  id: string
  contactId: string
  invoiceNumber: string
  invoiceDate: number
  dueDate: number | null
  notes: string | null
  createdAt: number
  // Related data
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
  } | null
}

// Input types for mutations
export interface InvoiceItemCreateInput {
  itemId?: string  // Optional reference to items table
  description: string
  quantity: number
  unitPrice: number
}

export interface InvoiceCreateInput {
  contactId: string
  invoiceDate: number
  dueDate?: number
  notes?: string
  items: InvoiceItemCreateInput[]
}

export interface InvoiceUpdateInput extends InvoiceCreateInput {
  id: string
}

// List response type
export interface InvoiceListResponse {
  invoices: InvoiceWithRelations[]
  totalItems: number
}