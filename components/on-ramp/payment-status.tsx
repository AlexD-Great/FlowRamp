"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle2, Clock, XCircle, ExternalLink, Loader2 } from "lucide-react"
import type { SessionStatus } from "@/lib/types/database"
import Link from "next/link"

interface PaymentStatusProps {
  status: SessionStatus
  sessionId: string
  txHash?: string
  receiptCID?: string
  amount?: number
  stablecoin?: string
  onReset?: () => void
}

export function PaymentStatus({
  status,
  sessionId,
  txHash,
  receiptCID,
  amount,
  stablecoin,
  onReset,
}: PaymentStatusProps) {
  const getStatusConfig = () => {
    switch (status) {
      case "completed":
        return {
          icon: CheckCircle2,
          iconColor: "text-green-500",
          title: "Transaction Complete!",
          description: "Your stablecoins have been successfully delivered to your wallet.",
          showTxLink: true,
        }
      case "processing":
        return {
          icon: Loader2,
          iconColor: "text-blue-500",
          title: "Processing Transaction",
          description: "Minting stablecoins and sending to your wallet. This usually takes 10-30 seconds.",
          showTxLink: false,
          animate: true,
        }
      case "paid":
        return {
          icon: Clock,
          iconColor: "text-amber-500",
          title: "Payment Received",
          description: "Your payment has been confirmed. Initiating blockchain transaction...",
          showTxLink: false,
        }
      case "failed":
        return {
          icon: XCircle,
          iconColor: "text-red-500",
          title: "Transaction Failed",
          description: "Something went wrong. Please contact support with your session ID.",
          showTxLink: false,
        }
      default:
        return {
          icon: Clock,
          iconColor: "text-muted-foreground",
          title: "Awaiting Payment",
          description: "Complete your payment to proceed.",
          showTxLink: false,
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
            <CardTitle className="text-2xl">{config.title}</CardTitle>
            <CardDescription className="text-base">{config.description}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Transaction Details */}
        <div className="rounded-lg bg-muted p-4 space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Session ID</span>
            <span className="font-mono text-xs">{sessionId}</span>
          </div>

          {amount && stablecoin && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Amount</span>
              <span className="font-medium">
                {amount.toFixed(2)} {stablecoin}
              </span>
            </div>
          )}

          {txHash && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Transaction Hash</span>
              <span className="font-mono text-xs truncate max-w-[200px]">{txHash}</span>
            </div>
          )}

          {receiptCID && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Receipt CID</span>
              <span className="font-mono text-xs truncate max-w-[200px]">{receiptCID}</span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-3">
          {config.showTxLink && txHash && (
            <Button asChild variant="default" size="lg">
              <Link href={`https://flowscan.org/transaction/${txHash}`} target="_blank">
                View on Flow Explorer
                <ExternalLink className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          )}

          {status === "completed" && onReset && (
            <Button onClick={onReset} variant="outline" size="lg">
              Make Another Purchase
            </Button>
          )}

          {status === "failed" && (
            <Button variant="outline" size="lg" asChild>
              <Link href="/support">Contact Support</Link>
            </Button>
          )}
        </div>

        {/* Processing Note */}
        {status === "processing" && (
          <p className="text-xs text-center text-muted-foreground">
            Please do not close this page. You will be notified when the transaction is complete.
          </p>
        )}
      </CardContent>
    </Card>
  )
}
