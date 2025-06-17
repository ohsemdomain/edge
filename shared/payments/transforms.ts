// shared/payments/transforms.ts
import type { DbPayment } from './database'
import type { Payment, PaymentWithRelations } from './api'

// Transform database row to API format
export function toApiPayment(dbPayment: DbPayment): Payment {
  return {
    id: dbPayment.id,
    contactId: dbPayment.contactId,
    invoiceId: dbPayment.invoiceId,
    amount: dbPayment.amount,
    paymentDate: dbPayment.paymentDate,
    paymentMethod: dbPayment.paymentMethod,
    type: dbPayment.type,
    notes: dbPayment.notes,
    createdAt: dbPayment.createdAt
  }
}

// Transform array of database rows to API format
export function toApiPayments(dbPayments: DbPayment[]): Payment[] {
  return dbPayments.map(toApiPayment)
}

// Transform database row with relations to API format with relations
export function toApiPaymentWithRelations(
  dbPayment: DbPayment, 
  relations: {
    contactName: string
    contactEmail: string
    contactPhone: string
    invoiceNumber: string | null
  }
): PaymentWithRelations {
  return {
    ...toApiPayment(dbPayment),
    contactName: relations.contactName,
    contactEmail: relations.contactEmail,
    contactPhone: relations.contactPhone,
    invoiceNumber: relations.invoiceNumber
  }
}