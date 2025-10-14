"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ExternalLink, RefreshCw } from "lucide-react"
import type { OnRampSession, OffRampRequest } from "@/lib/types/database"
import { formatCurrency } from "@/lib/utils/conversions"

interface TransactionTableProps {
  onRampSessions: OnRampSession[]
  offRampRequests: OffRampRequest[]
  onRefresh?: () => void
  isLoading?: boolean
}

export function TransactionTable({ onRampSessions, offRampRequests, onRefresh, isLoading }: TransactionTableProps) {
  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      completed: "default",
      processing: "secondary",
      paid: "secondary",
      funded: "secondary",
      pending: "outline",
      failed: "destructive",
      created: "outline",
    }

    return (
      <Badge variant={variants[status] || "outline"} className="capitalize">
        {status}
      </Badge>
    )
  }

  // Combine and sort all transactions
  const allTransactions = [
    ...onRampSessions.map((s) => ({
      id: s.id,
      type: "on-ramp" as const,
      amount: s.usdAmount,
      fiatAmount: s.fiatAmount,
      currency: s.fiatCurrency,
      stablecoin: s.stablecoin,
      status: s.status,
      walletAddress: s.walletAddress,
      txHash: s.txHash,
      created_at: s.created_at,
    })),
    ...offRampRequests.map((r) => ({
      id: r.id,
      type: "off-ramp" as const,
      amount: r.amount,
      fiatAmount: 0,
      currency: "NGN",
      stablecoin: r.stablecoin,
      status: r.status,
      walletAddress: r.walletAddress,
      txHash: undefined,
      created_at: r.created_at,
    })),
  ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Recent Transactions</CardTitle>
            <CardDescription>All on-ramp and off-ramp transactions</CardDescription>
          </div>
          {onRefresh && (
            <Button variant="outline" size="icon" onClick={onRefresh} disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {allTransactions.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">No transactions yet</div>
          ) : (
            allTransactions.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between p-4 rounded-lg border bg-card">
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge variant={tx.type === "on-ramp" ? "default" : "secondary"}>{tx.type}</Badge>
                    {getStatusBadge(tx.status)}
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
                  <p className="text-xs text-muted-foreground">{new Date(tx.created_at).toLocaleString()}</p>
                </div>

                <div className="flex items-center gap-2">
                  {tx.txHash && (
                    <Button variant="ghost" size="sm" asChild>
                      <a href={`https://flowscan.org/transaction/${tx.txHash}`} target="_blank" rel="noreferrer">
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </Button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}
