"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowDownRight, ExternalLink } from "lucide-react"
import type { OffRampRequest } from "@/lib/types/database"
import Link from "next/link"

interface WithdrawalHistoryProps {
  requests: OffRampRequest[]
}

export function WithdrawalHistory({ requests }: WithdrawalHistoryProps) {
  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      completed: "default",
      processing: "secondary",
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

  if (requests.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Withdrawal History</CardTitle>
          <CardDescription>Your recent off-ramp transactions will appear here</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="rounded-full bg-muted p-4 mb-4">
              <ArrowDownRight className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">No withdrawals yet</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Withdrawal History</CardTitle>
        <CardDescription>Your recent off-ramp transactions</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {requests.map((request) => (
            <div
              key={request.id}
              className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
            >
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <p className="font-medium">
                    {request.amount.toFixed(2)} {request.stablecoin}
                  </p>
                  {getStatusBadge(request.status)}
                </div>
                <p className="text-sm text-muted-foreground">
                  {request.payoutDetails?.method === "bank_transfer"
                    ? `${request.payoutDetails.bank} - ${request.payoutDetails.accountNumber}`
                    : request.payoutDetails?.phoneNumber}{" "}
                  • {new Date(request.created_at).toLocaleDateString()}
                </p>
                <p className="text-xs text-muted-foreground font-mono">{request.id}</p>
              </div>

              <Button variant="ghost" size="sm" asChild>
                <Link href={`/sell/status/${request.id}`}>
                  <ExternalLink className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
