"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { AlertCircle, RefreshCw, ExternalLink } from "lucide-react"
import type { OnRampSession, OffRampRequest } from "@/lib/types/database"
import { formatCurrency } from "@/lib/utils/conversions"

interface FailedTransactionsProps {
  onRampSessions: OnRampSession[]
  offRampRequests: OffRampRequest[]
  onRetry?: (id: string, type: "on-ramp" | "off-ramp") => void
}

export function FailedTransactions({ onRampSessions, offRampRequests, onRetry }: FailedTransactionsProps) {
  const failedOnRamp = onRampSessions.filter((s) => s.status === "failed")
  const failedOffRamp = offRampRequests.filter((r) => r.status === "failed")

  const allFailed = [
    ...failedOnRamp.map((s) => ({
      id: s.id,
      type: "on-ramp" as const,
      amount: s.usdAmount,
      fiatAmount: s.fiatAmount,
      currency: s.fiatCurrency,
      stablecoin: s.stablecoin,
      walletAddress: s.walletAddress,
      paymentRef: s.paymentRef,
      created_at: s.created_at,
    })),
    ...failedOffRamp.map((r) => ({
      id: r.id,
      type: "off-ramp" as const,
      amount: r.amount,
      fiatAmount: 0,
      currency: "NGN",
      stablecoin: r.stablecoin,
      walletAddress: r.walletAddress,
      paymentRef: r.memo,
      created_at: r.created_at,
    })),
  ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

  if (allFailed.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Failed Transactions</CardTitle>
          <CardDescription>Transactions requiring manual review</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="rounded-full bg-green-500/10 p-4 mb-4">
              <AlertCircle className="h-8 w-8 text-green-500" />
            </div>
            <p className="text-sm text-muted-foreground">No failed transactions</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-red-500" />
          Failed Transactions
          <Badge variant="destructive">{allFailed.length}</Badge>
        </CardTitle>
        <CardDescription>Transactions requiring manual review and retry</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {allFailed.map((tx) => (
            <div
              key={tx.id}
              className="flex items-center justify-between p-4 rounded-lg border border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-900"
            >
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <Badge variant={tx.type === "on-ramp" ? "default" : "secondary"}>{tx.type}</Badge>
                  <Badge variant="destructive">Failed</Badge>
                </div>
                <p className="font-medium">
                  {tx.amount.toFixed(2)} {tx.stablecoin}
                  {tx.fiatAmount > 0 && (
                    <span className="text-sm text-muted-foreground ml-2">
                      ({formatCurrency(tx.fiatAmount, tx.currency)})
                    </span>
                  )}
                </p>
                <p className="text-xs text-muted-foreground font-mono">{tx.walletAddress}</p>
                <p className="text-xs text-muted-foreground">
                  Ref: {tx.paymentRef} • {new Date(tx.created_at).toLocaleString()}
                </p>
              </div>

              <div className="flex items-center gap-2">
                {onRetry && (
                  <Button variant="outline" size="sm" onClick={() => onRetry(tx.id, tx.type)}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Retry
                  </Button>
                )}
                <Button variant="ghost" size="sm" asChild>
                  <a href={`/${tx.type === "on-ramp" ? "buy" : "sell"}`} target="_blank" rel="noreferrer">
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
