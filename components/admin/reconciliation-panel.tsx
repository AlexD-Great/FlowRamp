"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, AlertTriangle, RefreshCw } from "lucide-react"
import { useState } from "react"

interface ReconciliationPanelProps {
  onRunReconciliation?: () => Promise<void>
}

export function ReconciliationPanel({ onRunReconciliation }: ReconciliationPanelProps) {
  const [isRunning, setIsRunning] = useState(false)
  const [lastRun, setLastRun] = useState<Date | null>(null)
  const [results, setResults] = useState<{
    matched: number
    mismatched: number
    pending: number
  } | null>(null)

  const handleRunReconciliation = async () => {
    setIsRunning(true)
    try {
      if (onRunReconciliation) {
        await onRunReconciliation()
      }

      // Simulate reconciliation results
      await new Promise((resolve) => setTimeout(resolve, 2000))

      setResults({
        matched: Math.floor(Math.random() * 50) + 20,
        mismatched: Math.floor(Math.random() * 3),
        pending: Math.floor(Math.random() * 5),
      })

      setLastRun(new Date())
    } catch (error) {
      console.error("[v0] Reconciliation failed:", error)
    } finally {
      setIsRunning(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Reconciliation</CardTitle>
        <CardDescription>Match payment provider payouts with on-chain transfers</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Last Run</p>
            <p className="font-medium">{lastRun ? lastRun.toLocaleString() : "Never"}</p>
          </div>
          <Button onClick={handleRunReconciliation} disabled={isRunning}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isRunning ? "animate-spin" : ""}`} />
            {isRunning ? "Running..." : "Run Reconciliation"}
          </Button>
        </div>

        {results && (
          <div className="space-y-3 pt-4 border-t">
            <div className="flex items-center justify-between p-3 rounded-lg bg-green-500/10">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                <span className="font-medium">Matched Transactions</span>
              </div>
              <Badge variant="default">{results.matched}</Badge>
            </div>

            {results.mismatched > 0 && (
              <div className="flex items-center justify-between p-3 rounded-lg bg-red-500/10">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                  <span className="font-medium">Mismatched Transactions</span>
                </div>
                <Badge variant="destructive">{results.mismatched}</Badge>
              </div>
            )}

            {results.pending > 0 && (
              <div className="flex items-center justify-between p-3 rounded-lg bg-amber-500/10">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-amber-500" />
                  <span className="font-medium">Pending Review</span>
                </div>
                <Badge variant="secondary">{results.pending}</Badge>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
