// shared/payments/database.ts
import { integer, real, sqliteTable, text, index } from 'drizzle-orm/sqlite-core'

// Re-export the payments table from main schema
// (Note: The main schema is already using the correct camelCase field names)
export { payments } from '../../_server/db/schema'

// Database row type
export type DbPayment = {
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
}