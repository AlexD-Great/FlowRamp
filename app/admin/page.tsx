"use client"

import { useState, useEffect } from "react"
import { TransactionTable } from "@/components/admin/transaction-table"
import { FailedTransactions } from "@/components/admin/failed-transactions"
import { ReconciliationPanel } from "@/components/admin/reconciliation-panel"
import type { OnRampSession, OffRampRequest } from "@/lib/types/database"
import { FEES } from "@/lib/constants"

export default function AdminPage() {
  const [onRampSessions, setOnRampSessions] = useState<OnRampSession[]>([])
  const [offRampRequests, setOffRampRequests] = useState<OffRampRequest[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setIsLoading(true)
    try {
      // Load on-ramp sessions
      const onRampResponse = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/admin/onramp/sessions`)
      if (onRampResponse.ok) {
        const onRampData = await onRampResponse.json()
        setOnRampSessions(onRampData.sessions || [])
      }

      // Load off-ramp requests
      const offRampResponse = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/admin/offramp/requests`)
      if (offRampResponse.ok) {
        const offRampData = await offRampResponse.json()
        setOffRampRequests(offRampData.requests || [])
      }
    } catch (error) {
      console.error("Failed to load admin data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleRetry = async (id: string, type: "on-ramp" | "off-ramp") => {
    try {
      const endpoint = type === "on-ramp" 
        ? `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/admin/onramp/retry/${id}`
        : `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/admin/offramp/retry/${id}`
      
      const response = await fetch(endpoint, { method: "POST" })
      if (response.ok) {
        await loadData()
      }
    } catch (error) {
      console.error("Failed to retry transaction:", error)
    }
  }

  const failedOnRampSessions = onRampSessions.filter(s => s.status === "failed")
  const failedOffRampRequests = offRampRequests.filter(r => r.status === "failed")

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Admin Dashboard</h1>
          <p className="text-lg text-muted-foreground">Manage transactions and reconciliation</p>
        </div>

        <div className="space-y-8 max-w-7xl mx-auto">
          {/* All Transactions */}
          <TransactionTable
            onRampSessions={onRampSessions}
            offRampRequests={offRampRequests}
            onRefresh={loadData}
            isLoading={isLoading}
          />

          {/* Failed Transactions */}
          {(failedOnRampSessions.length > 0 || failedOffRampRequests.length > 0) && (
            <FailedTransactions
              onRampSessions={failedOnRampSessions}
              offRampRequests={failedOffRampRequests}
              onRetry={handleRetry}
            />
          )}

          {/* Reconciliation Panel */}
          <ReconciliationPanel />
        </div>
      </div>
    </div>
  )
}
