// Mock database implementation for development
// Replace with real Supabase/database calls in production

import type { OnRampSession, OffRampRequest, TxReceipt, User, SessionStatus, OffRampStatus } from "@/lib/types/database"

// In-memory storage
const users: Map<string, User> = new Map()
const onRampSessions: Map<string, OnRampSession> = new Map()
const offRampRequests: Map<string, OffRampRequest> = new Map()
const txReceipts: Map<string, TxReceipt> = new Map()

// Helper to generate IDs
function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

// User operations
export const userDb = {
  async create(flow_address: string, email?: string): Promise<User> {
    const user: User = {
      id: generateId("user"),
      flow_address,
      email,
      created_at: new Date(),
    }
    users.set(user.id, user)
    return user
  },

  async findByAddress(flow_address: string): Promise<User | null> {
    return Array.from(users.values()).find((u) => u.flow_address === flow_address) || null
  },

  async findById(id: string): Promise<User | null> {
    return users.get(id) || null
  },
}

// OnRamp Session operations
export const onRampSessionDb = {
  async create(data: Omit<OnRampSession, "id" | "created_at" | "updated_at">): Promise<OnRampSession> {
    const session: OnRampSession = {
      ...data,
      id: generateId("sess"),
      created_at: new Date(),
      updated_at: new Date(),
    }
    onRampSessions.set(session.id, session)
    return session
  },

  async findById(id: string): Promise<OnRampSession | null> {
    return onRampSessions.get(id) || null
  },

  async findByPaymentRef(paymentRef: string): Promise<OnRampSession | null> {
    return Array.from(onRampSessions.values()).find((s) => s.paymentRef === paymentRef) || null
  },

  async update(id: string, data: Partial<OnRampSession>): Promise<OnRampSession | null> {
    const session = onRampSessions.get(id)
    if (!session) return null

    const updated = {
      ...session,
      ...data,
      updated_at: new Date(),
    }
    onRampSessions.set(id, updated)
    return updated
  },

  async updateStatus(
    id: string,
    status: SessionStatus,
    additionalData?: Partial<OnRampSession>,
  ): Promise<OnRampSession | null> {
    return this.update(id, { status, ...additionalData })
  },

  async list(limit = 50): Promise<OnRampSession[]> {
    return Array.from(onRampSessions.values())
      .sort((a, b) => b.created_at.getTime() - a.created_at.getTime())
      .slice(0, limit)
  },
}

// OffRamp Request operations
export const offRampRequestDb = {
  async create(data: Omit<OffRampRequest, "id" | "created_at" | "updated_at">): Promise<OffRampRequest> {
    const request: OffRampRequest = {
      ...data,
      id: generateId("off"),
      created_at: new Date(),
      updated_at: new Date(),
    }
    offRampRequests.set(request.id, request)
    return request
  },

  async findById(id: string): Promise<OffRampRequest | null> {
    return offRampRequests.get(id) || null
  },

  async findByMemo(memo: string): Promise<OffRampRequest | null> {
    return Array.from(offRampRequests.values()).find((r) => r.memo === memo) || null
  },

  async update(id: string, data: Partial<OffRampRequest>): Promise<OffRampRequest | null> {
    const request = offRampRequests.get(id)
    if (!request) return null

    const updated = {
      ...request,
      ...data,
      updated_at: new Date(),
    }
    offRampRequests.set(id, updated)
    return updated
  },

  async updateStatus(
    id: string,
    status: OffRampStatus,
    additionalData?: Partial<OffRampRequest>,
  ): Promise<OffRampRequest | null> {
    return this.update(id, { status, ...additionalData })
  },

  async list(limit = 50): Promise<OffRampRequest[]> {
    return Array.from(offRampRequests.values())
      .sort((a, b) => b.created_at.getTime() - a.created_at.getTime())
      .slice(0, limit)
  },
}

// Transaction Receipt operations
export const txReceiptDb = {
  async create(session_id: string, cid: string, json_blob: Record<string, any>): Promise<TxReceipt> {
    const receipt: TxReceipt = {
      id: generateId("receipt"),
      session_id,
      cid,
      json_blob,
      created_at: new Date(),
    }
    txReceipts.set(receipt.id, receipt)
    return receipt
  },

  async findBySessionId(session_id: string): Promise<TxReceipt | null> {
    return Array.from(txReceipts.values()).find((r) => r.session_id === session_id) || null
  },
}
