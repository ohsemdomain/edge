// shared/payments/api.ts

// Core Payment type in camelCase (matches API responses)
export interface Payment {
  id: string
  contactId: string
  invoiceId: string | null
  amount: number
  paymentDate: number  // Unix timestamp in seconds
  paymentMethod: string | null
  type: 'payment' | 'refund'
  notes: string | null
  isActive: boolean
  createdAt: number    // Unix timestamp in seconds
}

// Payment with related data for list/detail views
export interface PaymentWithRelations {
  id: string
  contactId: string
  invoiceId: string | null
  amount: number
  paymentDate: number
  paymentMethod: string | null
  type: 'payment' | 'refund'
  notes: string | null
  isActive: boolean
  createdAt: number
  // Related data
  contactName: string
  contactEmail: string
  contactPhone: string
  invoiceNumber: string | null
}

// Input types for mutations
export interface PaymentCreateInput {
  contactId: string
  invoiceId?: string
  amount: number
  paymentDate: number
  paymentMethod?: string
  type?: 'payment' | 'refund'
  notes?: string
}

export interface PaymentUpdateInput extends PaymentCreateInput {
  id: string
}

// List response type
export interface PaymentListResponse {
  payments: PaymentWithRelations[]
  totalItems: number
}

// Balance response type
export interface PaymentBalanceResponse {
  totalInvoiced: number
  totalPaid: number
  balance: number
}