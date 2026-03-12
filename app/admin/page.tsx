"use client"

import { useState, useEffect } from "react"
import { TransactionTable } from "@/components/admin/transaction-table"
import { FailedTransactions } from "@/components/admin/failed-transactions"
import { ReconciliationPanel } from "@/components/admin/reconciliation-panel"
import { useAuth } from "@/lib/firebase/auth"
import type { OnRampSession, OffRampRequest, AdminStats } from "@/lib/types/database"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"

export default function AdminPage() {
  const { user } = useAuth()
  const [jwt, setJwt] = useState<string | null>(null)
  const [onRampSessions, setOnRampSessions] = useState<OnRampSession[]>([])
  const [offRampRequests, setOffRampRequests] = useState<OffRampRequest[]>([])
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (user) {
      user.getIdToken().then((token) => {
        setJwt(token)
      })
    }
  }, [user])

  useEffect(() => {
    if (jwt) loadData()
  }, [jwt])

  const getAuthHeaders = (): HeadersInit => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${jwt}`,
  })

  const loadData = async () => {
    if (!jwt) return
    setIsLoading(true)
    try {
      const [onRampRes, offRampRes, statsRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/admin/pending-onramp`, { headers: getAuthHeaders() }),
        fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/admin/pending-offramp`, { headers: getAuthHeaders() }),
        fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/admin/stats`, { headers: getAuthHeaders() }),
      ])

      if (onRampRes.ok) {
        const data = await onRampRes.json()
        setOnRampSessions(data.sessions || [])
      }
      if (offRampRes.ok) {
        const data = await offRampRes.json()
        setOffRampRequests(data.requests || [])
      }
      if (statsRes.ok) {
        setStats(await statsRes.json())
      }
    } catch (error) {
      console.error("Failed to load admin data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleApprove = async (id: string, type: "on-ramp" | "off-ramp") => {
    if (!jwt) return
    try {
      const endpoint = type === "on-ramp"
        ? `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/admin/approve-onramp/${id}`
        : `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/admin/approve-offramp/${id}`

      const response = await fetch(endpoint, { method: "POST", headers: getAuthHeaders() })
      if (response.ok) {
        toast.success(`${type} approved successfully`)
        await loadData()
      } else {
        const err = await response.json()
        toast.error(err.error || "Failed to approve")
      }
    } catch (error) {
      console.error("Failed to approve:", error)
      toast.error("Failed to approve transaction")
    }
  }

  const handleReject = async (id: string, type: "on-ramp" | "off-ramp", reason?: string) => {
    if (!jwt) return
    try {
      const endpoint = type === "on-ramp"
        ? `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/admin/reject-onramp/${id}`
        : `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/admin/reject-offramp/${id}`

      const response = await fetch(endpoint, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ reason: reason || "Rejected by admin" }),
      })
      if (response.ok) {
        toast.success(`${type} rejected`)
        await loadData()
      } else {
        const err = await response.json()
        toast.error(err.error || "Failed to reject")
      }
    } catch (error) {
      console.error("Failed to reject:", error)
      toast.error("Failed to reject transaction")
    }
  }

  const failedOnRamp = onRampSessions.filter(
    (s) => s.status === "failed" || s.status === "pipeline_failed" || s.status === "collection_failed"
  )
  const failedOffRamp = offRampRequests.filter(
    (r) => r.status === "failed" || r.status === "pipeline_failed" || r.status === "ngn_payout_failed"
  )

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Admin Dashboard</h1>
          <p className="text-lg text-muted-foreground">Manage transactions and pipeline operations</p>
        </div>

        <div className="space-y-8 max-w-7xl mx-auto">
          {/* Stats Cards */}
          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Pending On-Ramp</CardTitle></CardHeader>
                <CardContent><p className="text-2xl font-bold">{stats.pendingOnrampCount}</p></CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Pending Off-Ramp</CardTitle></CardHeader>
                <CardContent><p className="text-2xl font-bold">{stats.pendingOfframpCount}</p></CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Completed Today</CardTitle></CardHeader>
                <CardContent><p className="text-2xl font-bold">{stats.todayCompletedOnramp + stats.todayCompletedOfframp}</p></CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Wallet Balance</CardTitle></CardHeader>
                <CardContent><p className="text-2xl font-bold">{parseFloat(stats.walletBalance || "0").toFixed(2)} FLOW</p></CardContent>
              </Card>
            </div>
          )}

          {/* All Transactions */}
          <TransactionTable
            onRampSessions={onRampSessions}
            offRampRequests={offRampRequests}
            onRefresh={loadData}
            onApprove={handleApprove}
            onReject={handleReject}
            isLoading={isLoading}
          />

          {/* Failed Transactions */}
          {(failedOnRamp.length > 0 || failedOffRamp.length > 0) && (
            <FailedTransactions
              onRampSessions={failedOnRamp}
              offRampRequests={failedOffRamp}
              onRetry={handleApprove}
            />
          )}

          {/* Reconciliation Panel */}
          <ReconciliationPanel />
        </div>
      </div>
    </div>
  )
}
