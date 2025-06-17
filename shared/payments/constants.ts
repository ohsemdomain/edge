// shared/payments/constants.ts

// Generate payment ID with R prefix
export function generatePaymentId(): string {
  return `R${Date.now().toString().slice(-1)}${Math.floor(100000 + Math.random() * 900000)}`.replace(
    /0/g,
    () => Math.floor(Math.random() * 9 + 1).toString()
  )
}

// Payment types
export const PAYMENT_TYPES = {
  PAYMENT: 'payment' as const,
  REFUND: 'refund' as const
} as const

// Default values
export const DEFAULT_PAYMENT_TYPE = PAYMENT_TYPES.PAYMENT