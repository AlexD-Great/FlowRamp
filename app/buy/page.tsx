"use client"

import { useState, useEffect } from "react"
import { BuyForm } from "@/components/on-ramp/buy-form"
import { PaymentStatus } from "@/components/on-ramp/payment-status"
import { TransactionHistory } from "@/components/on-ramp/transaction-history"
import type { OnRampSession } from "@/lib/types/database"

export default function BuyPage() {
  const [currentSession, setCurrentSession] = useState<OnRampSession | null>(null)
  const [sessions, setSessions] = useState<OnRampSession[]>([])
  const [isLoading, setIsLoading] = useState(false)

  // Load transaction history
  useEffect(() => {
    loadSessions()
  }, [])

  // Poll for session updates when processing
  useEffect(() => {
    if (currentSession && (currentSession.status === "processing" || currentSession.status === "paid")) {
      const interval = setInterval(() => {
        pollSessionStatus(currentSession.id)
      }, 3000)

      return () => clearInterval(interval)
    }
  }, [currentSession])

  const loadSessions = async () => {
    try {
      const response = await fetch("/api/onramp/sessions")
      if (response.ok) {
        const data = await response.json()
        setSessions(data.sessions || [])
      }
    } catch (error) {
      console.error("[v0] Failed to load sessions:", error)
    }
  }

  const pollSessionStatus = async (sessionId: string) => {
    try {
      const response = await fetch(`/api/session/${sessionId}`)
      if (response.ok) {
        const data = await response.json()
        setCurrentSession(data)

        // Reload history when completed
        if (data.status === "completed" || data.status === "failed") {
          loadSessions()
        }
      }
    } catch (error) {
      console.error("[v0] Failed to poll session:", error)
    }
  }

  const handleSubmit = async (formData: {
    walletAddress: string
    fiatAmount: number
    fiatCurrency: string
    stablecoin: string
  }) => {
    setIsLoading(true)

    try {
      const response = await fetch("/api/onramp/create-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          walletAddress: formData.walletAddress,
          fiatCurrency: formData.fiatCurrency,
          fiatAmount: formData.fiatAmount,
          preferredStablecoin: formData.stablecoin,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to create session")
      }

      const data = await response.json()

      // In production, redirect to payment URL
      // For demo, simulate payment flow
      if (data.paymentUrl) {
        // Open payment URL in new window
        window.open(data.paymentUrl, "_blank")
      }

      // Fetch the created session
      const sessionResponse = await fetch(`/api/session/${data.sessionId}`)
      if (sessionResponse.ok) {
        const sessionData = await sessionResponse.json()
        setCurrentSession(sessionData)
      }
    } catch (error) {
      console.error("[v0] Failed to create session:", error)
      alert("Failed to create session. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleReset = () => {
    setCurrentSession(null)
    loadSessions()
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4 text-balance">Buy Flow Stablecoins</h1>
          <p className="text-lg text-muted-foreground text-balance max-w-2xl mx-auto">
            Convert your Nigerian Naira to Flow stablecoins instantly and securely
          </p>
        </div>

        {/* Main Content */}
        <div className="flex flex-col items-center gap-8">
          {currentSession ? (
            <PaymentStatus
              status={currentSession.status}
              sessionId={currentSession.id}
              txHash={currentSession.txHash}
              receiptCID={currentSession.receiptCID}
              amount={currentSession.usdAmount}
              stablecoin={currentSession.stablecoin}
              onReset={handleReset}
            />
          ) : (
            <BuyForm onSubmit={handleSubmit} isLoading={isLoading} />
          )}

          {/* Transaction History */}
          {sessions.length > 0 && !currentSession && (
            <div className="w-full max-w-2xl">
              <TransactionHistory sessions={sessions} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
