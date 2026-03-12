// Database types for FlowRamp application

export type SessionStatus =
  | "awaiting_ngn_deposit"
  | "collection_pending"
  | "collection_failed"
  | "ngn_deposit_confirmed"
  | "processing"
  | "completed"
  | "pipeline_failed"
  | "failed"
  | "rejected"
  // Legacy statuses (backward compat)
  | "created"
  | "paid"
  | "awaiting_admin_approval"

export type OffRampStatus =
  | "awaiting_flow_deposit"
  | "flow_deposit_confirmed"
  | "processing"
  | "ngn_payout_pending"
  | "ngn_payout_failed"
  | "completed"
  | "pipeline_failed"
  | "failed"
  | "rejected"
  // Legacy statuses (backward compat)
  | "created"
  | "pending"
  | "funded"
  | "awaiting_admin_approval"

export interface OnRampSession {
  id: string
  userId?: string
  userEmail?: string
  walletAddress: string
  fiatAmount: number
  fiatCurrency: string
  token: string
  estimatedFLOW?: number
  estimatedUSDT?: number
  rateSnapshot?: {
    flowNGNRate: number
    usdtNGNRate: number
    flowUSDTRate: number
  }
  platformFeeNGN?: number
  status: SessionStatus
  ycCollectionId?: string
  flowDelivered?: number
  flowTxHash?: string
  pipelineStep?: string
  pipelineError?: string
  createdAt: string
  updatedAt?: string
  completedAt?: string
  error?: string
  // Legacy fields
  usdAmount?: number
  stablecoin?: string
  txHash?: string
  receiptCID?: string
  created_at?: string
  updated_at?: string
  paymentProvider?: string
  paymentReference?: string
}

export interface OffRampRequest {
  id: string
  userId?: string
  walletAddress: string
  amount: number
  token: string
  depositAddress: string
  estimatedNGN?: number
  estimatedUSDT?: number
  rateSnapshot?: {
    flowNGNRate: number
    usdtNGNRate: number
    flowUSDTRate: number
  }
  platformFeeNGN?: number
  status: OffRampStatus
  payoutDetails?: any
  ycPaymentId?: string
  ngnSent?: number
  pipelineStep?: string
  pipelineError?: string
  createdAt: string
  updatedAt?: string
  completedAt?: string
  error?: string
  // Legacy fields
  stablecoin?: string
  deposit_address?: string
  memo?: string
  txHash?: string
  paymentReference?: string
}

export interface User {
  id: string
  email: string
  flowAddress?: string
  created_at: string
  updated_at: string
}

export interface AdminStats {
  pendingOnrampCount: number
  pendingOfframpCount: number
  todayCompletedOnramp: number
  todayCompletedOfframp: number
  totalCompletedOnramp: number
  totalCompletedOfframp: number
  walletBalance: string
}
