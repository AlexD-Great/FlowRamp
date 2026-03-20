"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ExternalLink, RefreshCw, CheckCircle2, XCircle } from "lucide-react"
import type { OnRampSession, OffRampRequest } from "@/lib/types/database"

interface TransactionTableProps {
  onRampSessions: OnRampSession[]
  offRampRequests: OffRampRequest[]
  onRefresh?: () => void
  onApprove?: (id: string, type: "on-ramp" | "off-ramp") => void
  onReject?: (id: string, type: "on-ramp" | "off-ramp") => void
  isLoading?: boolean
}

const STATUS_VARIANTS: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  completed: "default",
  processing: "secondary",
  awaiting_payment: "outline",
  collection_pending: "outline",
  awaiting_ngn_deposit: "outline",
  ngn_deposit_confirmed: "secondary",
  awaiting_flow_deposit: "outline",
  flow_deposit_confirmed: "secondary",
  payout_pending: "secondary",
  ngn_payout_pending: "secondary",
  payout_failed: "destructive",
  collection_failed: "destructive",
  ngn_payout_failed: "destructive",
  pipeline_failed: "destructive",
  failed: "destructive",
  rejected: "destructive",
  // Legacy
  paid: "secondary",
  funded: "secondary",
  pending: "outline",
  created: "outline",
  awaiting_admin_approval: "outline",
}

const ACTIONABLE_STATUSES = new Set([
  "awaiting_admin_approval",
  "awaiting_payment",
  "awaiting_ngn_deposit",
  "collection_pending",
  "collection_failed",
  "ngn_deposit_confirmed",
  "pipeline_failed",
  "awaiting_flow_deposit",
  "flow_deposit_confirmed",
  "payout_failed",
])

export function TransactionTable({
  onRampSessions,
  offRampRequests,
  onRefresh,
  onApprove,
  onReject,
  isLoading,
}: TransactionTableProps) {
  // Combine and sort all transactions
  const allTransactions = [
    ...onRampSessions.map((s) => ({
      id: s.id,
      type: "on-ramp" as const,
      fiatAmount: s.fiatAmount,
      currency: s.fiatCurrency || "NGN",
      token: s.token || s.stablecoin || "FLOW",
      estimatedToken: s.estimatedFLOW,
      status: s.status,
      walletAddress: s.walletAddress,
      txHash: s.flowTxHash || s.txHash,
      pipelineStep: s.pipelineStep,
      pipelineError: s.pipelineError,
      createdAt: s.createdAt || s.created_at || "",
    })),
    ...offRampRequests.map((r) => ({
      id: r.id,
      type: "off-ramp" as const,
      fiatAmount: r.estimatedNGN || r.ngnSent || 0,
      currency: "NGN",
      token: r.token || r.stablecoin || "FLOW",
      estimatedToken: r.amount,
      status: r.status,
      walletAddress: r.walletAddress,
      txHash: r.txHash,
      pipelineStep: r.pipelineStep,
      pipelineError: r.pipelineError,
      createdAt: r.createdAt || "",
    })),
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  const formatNGN = (amount: number) => `₦${amount.toLocaleString()}`

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Transactions</CardTitle>
            <CardDescription>On-ramp and off-ramp pipeline transactions</CardDescription>
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
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant={tx.type === "on-ramp" ? "default" : "secondary"}>{tx.type}</Badge>
                    <Badge variant={STATUS_VARIANTS[tx.status] || "outline"} className="capitalize">
                      {tx.status.replace(/_/g, " ")}
                    </Badge>
                    {tx.pipelineStep && tx.pipelineStep !== "done" && tx.pipelineStep !== "error" && (
                      <span className="text-xs text-muted-foreground">({tx.pipelineStep})</span>
                    )}
                  </div>
                  <p className="font-medium">
                    {tx.type === "on-ramp" ? (
                      <>
                        {formatNGN(tx.fiatAmount)}
                        {tx.estimatedToken != null && (
                          <span className="text-sm text-muted-foreground ml-2">
                            → ~{tx.estimatedToken} {tx.token}
                          </span>
                        )}
                      </>
                    ) : (
                      <>
                        {tx.estimatedToken} {tx.token}
                        {tx.fiatAmount > 0 && (
                          <span className="text-sm text-muted-foreground ml-2">
                            → {formatNGN(tx.fiatAmount)}
                          </span>
                        )}
                      </>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground font-mono">{tx.walletAddress}</p>
                  {tx.pipelineError && (
                    <p className="text-xs text-destructive">Error: {tx.pipelineError}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {tx.createdAt ? new Date(tx.createdAt).toLocaleString() : "—"}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0 ml-4">
                  {tx.txHash && (
                    <Button variant="ghost" size="sm" asChild>
                      <a href={`https://flowscan.org/transaction/${tx.txHash}`} target="_blank" rel="noreferrer">
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </Button>
                  )}
                  {ACTIONABLE_STATUSES.has(tx.status) && onApprove && (
                    <Button variant="outline" size="sm" onClick={() => onApprove(tx.id, tx.type)}>
                      <CheckCircle2 className="h-4 w-4 mr-1" /> Approve
                    </Button>
                  )}
                  {ACTIONABLE_STATUSES.has(tx.status) && onReject && (
                    <Button variant="ghost" size="sm" className="text-destructive" onClick={() => onReject(tx.id, tx.type)}>
                      <XCircle className="h-4 w-4 mr-1" /> Reject
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
