"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, Clock, XCircle, Loader2, ArrowDownRight, ExternalLink } from "lucide-react"
import type { OffRampStatus } from "@/lib/types/database"
import Link from "next/link"

interface WithdrawalStatusProps {
  status: OffRampStatus
  requestId: string
  amount?: number
  stablecoin?: string
  fiatAmount?: number
  depositAddress?: string
  memo?: string
  payoutDetails?: {
    method: string
    bank?: string
    accountNumber?: string
    accountName?: string
    phoneNumber?: string
  }
  onReset?: () => void
}

export function WithdrawalStatus({
  status,
  requestId,
  amount,
  stablecoin,
  fiatAmount,
  depositAddress,
  memo,
  payoutDetails,
  onReset,
}: WithdrawalStatusProps) {
  const getStatusConfig = () => {
    switch (status) {
      case "completed":
        return {
          icon: CheckCircle2,
          iconColor: "text-green-500",
          title: "Withdrawal Complete!",
          description: "Your NGN has been sent to your account.",
          badge: "Completed",
          badgeVariant: "default" as const,
        }
      case "processing":
        return {
          icon: Loader2,
          iconColor: "text-blue-500",
          title: "Processing Payout",
          description: "We're processing your withdrawal. This usually takes 5-15 minutes.",
          badge: "Processing",
          badgeVariant: "secondary" as const,
          animate: true,
        }
      case "funded":
        return {
          icon: Clock,
          iconColor: "text-green-500",
          title: "Deposit Confirmed",
          description: "We've received your stablecoins. Initiating payout...",
          badge: "Funded",
          badgeVariant: "secondary" as const,
        }
      case "pending":
        return {
          icon: Clock,
          iconColor: "text-amber-500",
          title: "Awaiting Deposit",
          description: "Send your stablecoins to the address provided to complete the withdrawal.",
          badge: "Pending",
          badgeVariant: "outline" as const,
        }
      case "failed":
        return {
          icon: XCircle,
          iconColor: "text-red-500",
          title: "Withdrawal Failed",
          description: "Something went wrong. Please contact support with your request ID.",
          badge: "Failed",
          badgeVariant: "destructive" as const,
        }
      default:
        return {
          icon: Clock,
          iconColor: "text-muted-foreground",
          title: "Request Created",
          description: "Your withdrawal request has been created.",
          badge: "Created",
          badgeVariant: "outline" as const,
        }
    }
  }

  const config = getStatusConfig()
  const Icon = config.icon

  return (
    <Card className="w-full max-w-lg">
      <CardHeader>
        <div className="flex flex-col items-center text-center space-y-4">
          <div className={`rounded-full bg-muted p-4 ${config.iconColor}`}>
            <Icon className={`h-12 w-12 ${config.animate ? "animate-spin" : ""}`} />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-center gap-2">
              <CardTitle className="text-2xl">{config.title}</CardTitle>
              <Badge variant={config.badgeVariant}>{config.badge}</Badge>
            </div>
            <CardDescription className="text-base">{config.description}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Transaction Details */}
        <div className="rounded-lg bg-muted p-4 space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Request ID</span>
            <span className="font-mono text-xs">{requestId}</span>
          </div>

          {amount && stablecoin && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Amount Sent</span>
              <span className="font-medium">
                {amount.toFixed(2)} {stablecoin}
              </span>
            </div>
          )}

          {fiatAmount && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">You Receive</span>
              <span className="font-medium">₦{fiatAmount.toLocaleString()}</span>
            </div>
          )}

          {payoutDetails && (
            <>
              <div className="h-px bg-border my-2" />
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Payout Method</span>
                <span className="font-medium capitalize">{payoutDetails.method.replace("_", " ")}</span>
              </div>
              {payoutDetails.bank && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Bank</span>
                  <span className="font-medium">{payoutDetails.bank}</span>
                </div>
              )}
              {payoutDetails.accountNumber && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Account</span>
                  <span className="font-medium">{payoutDetails.accountNumber}</span>
                </div>
              )}
            </>
          )}
        </div>

        {/* Deposit Instructions for Pending */}
        {status === "pending" && depositAddress && memo && (
          <div className="rounded-lg border-2 border-primary/20 bg-primary/5 p-4 space-y-3">
            <p className="text-sm font-medium">Send your stablecoins to:</p>
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-muted-foreground">Address:</span>
                <p className="font-mono text-xs break-all mt-1">{depositAddress}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Memo:</span>
                <p className="font-mono text-xs mt-1">{memo}</p>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col gap-3">
          {status === "completed" && onReset && (
            <Button onClick={onReset} size="lg">
              <ArrowDownRight className="mr-2 h-4 w-4" />
              Make Another Withdrawal
            </Button>
          )}

          {status === "failed" && (
            <Button variant="outline" size="lg" asChild>
              <Link href="/support">
                Contact Support
                <ExternalLink className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          )}

          {(status === "processing" || status === "funded") && (
            <p className="text-xs text-center text-muted-foreground">
              Your payout is being processed. You will receive a notification when complete.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
