"use client"

import { useState, useEffect } from "react"
import { StatsOverview } from "@/components/admin/stats-overview"
import { TransactionTable } from "@/components/admin/transaction-table"
import { FailedTransactions } from "@/components/admin/failed-transactions"
import { ReconciliationPanel } from "@/components/admin/reconciliation-panel"
import type { OnRampSession, OffRampRequest } from "@/lib/types/database"
import { FEES } from "@/lib/constants"

export default function AdminPage() {
  const [onRampSessions, setOnRampSessions] = useState<OnRampSession[]>([])
  const [offRampRequests, setOffRampRequests] = useState<OffRampRequest[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setIsLoading(true)
    try {
      const [sessionsRes, requestsRes] = await Promise.all([
        fetch("/api/onramp/sessions"),
        fetch("/api/offramp/requests"),
      ])

      if (sessionsRes.ok) {
        const data = await sessionsRes.json()
        setOnRampSessions(data.sessions || [])
      }

      if (requestsRes.ok) {
        const data = await requestsRes.json()
        setOffRampRequests(data.requests || [])
      }
    } catch (error) {
      console.error("[v0] Failed to load admin data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleRetry = async (id: string, type: "on-ramp" | "off-ramp") => {
    console.log("[v0] Retrying transaction:", id, type)
    // In production, implement retry logic
    alert(`Retry functionality for ${type} transaction ${id} would be implemented here`)
  }

  const handleReconciliation = async () => {
    console.log("[v0] Running reconciliation...")
    // In production, implement reconciliation logic
    // Compare payment provider records with on-chain transactions
  }

  // Calculate stats
  const stats = {
    totalOnRampVolume: onRampSessions.filter((s) => s.status === "completed").reduce((sum, s) => sum + s.usdAmount, 0),
    totalOffRampVolume: offRampRequests.filter((r) => r.status === "completed").reduce((sum, r) => sum + r.amount, 0),
    totalUsers: new Set([...onRampSessions.map((s) => s.walletAddress), ...offRampRequests.map((r) => r.walletAddress)])
      .size,
    totalRevenue:
      onRampSessions
        .filter((s) => s.status === "completed")
        .reduce((sum, s) => sum + s.usdAmount * FEES.ON_RAMP_PERCENTAGE, 0) +
      offRampRequests
        .filter((r) => r.status === "completed")
        .reduce((sum, r) => sum + r.amount * FEES.OFF_RAMP_PERCENTAGE, 0),
    onRampCount: onRampSessions.filter((s) => s.status === "completed").length,
    offRampCount: offRampRequests.filter((r) => r.status === "completed").length,
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold mb-4">Admin Dashboard</h1>
          <p className="text-lg text-muted-foreground">
            Monitor transactions, reconcile payments, and manage the FlowRamp platform
          </p>
        </div>

        {/* Stats Overview */}
        <div className="mb-8">
          <StatsOverview stats={stats} />
        </div>

        {/* Failed Transactions */}
        <div className="mb-8">
          <FailedTransactions onRampSessions={onRampSessions} offRampRequests={offRampRequests} onRetry={handleRetry} />
        </div>

        {/* Reconciliation Panel */}
        <div className="mb-8">
          <ReconciliationPanel onRunReconciliation={handleReconciliation} />
        </div>

        {/* Transaction Table */}
        <TransactionTable
          onRampSessions={onRampSessions}
          offRampRequests={offRampRequests}
          onRefresh={loadData}
          isLoading={isLoading}
        />
      </div>
    </div>
  )
}
