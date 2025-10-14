// Database types following the FlowRamp specification

export type SessionStatus = "created" | "paid" | "processing" | "completed" | "failed"

export type OffRampStatus = "created" | "pending" | "funded" | "processing" | "completed" | "failed"

export interface User {
  id: string
  flow_address: string
  email?: string
  created_at: Date
}

export interface OnRampSession {
  id: string
  user_id?: string
  walletAddress: string
  fiatAmount: number
  fiatCurrency: string
  usdAmount: number
  stablecoin: "fUSDC" | "fUSDT"
  paymentRef: string
  paymentProviderRef?: string
  status: SessionStatus
  txHash?: string
  receiptCID?: string
  created_at: Date
  updated_at: Date
}

export interface OffRampRequest {
  id: string
  user_id?: string
  walletAddress: string
  amount: number
  stablecoin: "fUSDC" | "fUSDT"
  deposit_address: string
  memo: string
  status: OffRampStatus
  paymentProviderRef?: string
  payoutReceiptCID?: string
  payoutDetails?: {
    method: "bank_transfer" | "mobile_money"
    bank?: string
    accountNumber?: string
    accountName?: string
    phoneNumber?: string
  }
  created_at: Date
  updated_at: Date
}

export interface TxReceipt {
  id: string
  session_id: string
  cid: string
  json_blob: Record<string, any>
  created_at: Date
}

export interface CreateOnRampSessionRequest {
  walletAddress: string
  fiatCurrency: string
  fiatAmount: number
  preferredStablecoin?: "fUSDC" | "fUSDT"
}

export interface CreateOffRampRequest {
  walletAddress: string
  amount: number
  stablecoin: "fUSDC" | "fUSDT"
  payoutMethod: "bank_transfer" | "mobile_money"
  payoutDetails: {
    bank?: string
    accountNumber?: string
    accountName?: string
    phoneNumber?: string
  }
}
