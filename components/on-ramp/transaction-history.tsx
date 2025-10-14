"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ExternalLink, ArrowUpRight } from "lucide-react"
import type { OnRampSession } from "@/lib/types/database"
import { formatCurrency } from "@/lib/utils/conversions"
import Link from "next/link"

interface TransactionHistoryProps {
  sessions: OnRampSession[]
}

export function TransactionHistory({ sessions }: TransactionHistoryProps) {
  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      completed: "default",
      processing: "secondary",
      paid: "secondary",
      failed: "destructive",
      created: "outline",
    }

    return (
      <Badge variant={variants[status] || "outline"} className="capitalize">
        {status}
      </Badge>
    )
  }

  if (sessions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
          <CardDescription>Your recent on-ramp transactions will appear here</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="rounded-full bg-muted p-4 mb-4">
              <ArrowUpRight className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">No transactions yet</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Transaction History</CardTitle>
        <CardDescription>Your recent on-ramp transactions</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {sessions.map((session) => (
            <div
              key={session.id}
              className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
            >
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <p className="font-medium">
                    {session.usdAmount.toFixed(2)} {session.stablecoin}
                  </p>
                  {getStatusBadge(session.status)}
                </div>
                <p className="text-sm text-muted-foreground">
                  {formatCurrency(session.fiatAmount, session.fiatCurrency)} •{" "}
                  {new Date(session.created_at).toLocaleDateString()}
                </p>
                <p className="text-xs text-muted-foreground font-mono">{session.id}</p>
              </div>

              {session.txHash && (
                <Button variant="ghost" size="sm" asChild>
                  <Link href={`https://flowscan.org/transaction/${session.txHash}`} target="_blank">
                    <ExternalLink className="h-4 w-4" />
                  </Link>
                </Button>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
