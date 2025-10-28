// Database types for FlowRamp application

export type SessionStatus = "created" | "paid" | "processing" | "completed" | "failed"

export type OffRampStatus = "created" | "pending" | "processing" | "completed" | "failed"

export interface OnRampSession {
  id: string
  walletAddress: string
  fiatAmount: number
  fiatCurrency: string
  usdAmount: number
  stablecoin: string
  status: SessionStatus
  paymentProvider?: string
  paymentReference?: string
  txHash?: string
  receiptCID?: string
  created_at: string
  updated_at: string
  error?: string
}

export interface OffRampRequest {
  id: string
  walletAddress: string
  usdAmount: number
  stablecoin: string
  fiatAmount: number
  fiatCurrency: string
  bankAccount: {
    accountNumber: string
    accountName: string
    bankName: string
    bankCode?: string
  }
  status: OffRampStatus
  txHash?: string
  paymentReference?: string
  created_at: string
  updated_at: string
  error?: string
}

export interface User {
  id: string
  email: string
  flowAddress?: string
  created_at: string
  updated_at: string
}

export interface AdminStats {
  totalOnRampVolume: number
  totalOffRampVolume: number
  totalTransactions: number
  activeUsers: number
  pendingTransactions: number
  failedTransactions: number
}
