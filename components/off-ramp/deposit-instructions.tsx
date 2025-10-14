"use client"

import type React from "react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Copy, CheckCircle2, AlertCircle } from "lucide-react"
import { useState } from "react"
import { Badge } from "@/components/ui/badge"

interface DepositInstructionsProps {
  requestId: string
  depositAddress: string
  memo: string
  amount: number
  stablecoin: string
  onCancel?: () => void
}

export function DepositInstructions({
  requestId,
  depositAddress,
  memo,
  amount,
  stablecoin,
  onCancel,
}: DepositInstructionsProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null)

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text)
    setCopiedField(field)
    setTimeout(() => setCopiedField(null), 2000)
  }

  return (
    <Card className="w-full max-w-lg">
      <CardHeader>
        <div className="flex items-center gap-2 mb-2">
          <Badge variant="secondary">Step 2 of 3</Badge>
        </div>
        <CardTitle className="text-2xl">Send Your Stablecoins</CardTitle>
        <CardDescription>Transfer the exact amount to the address below with the memo</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Important Notice */}
        <div className="flex gap-3 p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
          <AlertCircle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div className="space-y-1 text-sm">
            <p className="font-medium text-amber-900 dark:text-amber-100">Important Instructions</p>
            <ul className="list-disc list-inside space-y-1 text-amber-800 dark:text-amber-200">
              <li>Send the exact amount specified</li>
              <li>Include the memo/reference in your transaction</li>
              <li>Use the correct stablecoin ({stablecoin})</li>
              <li>Double-check all details before sending</li>
            </ul>
          </div>
        </div>

        {/* Amount to Send */}
        <div className="space-y-2">
          <Label>Amount to Send</Label>
          <div className="flex items-center justify-between p-4 rounded-lg bg-muted">
            <div>
              <p className="text-2xl font-bold">
                {amount.toFixed(2)} {stablecoin}
              </p>
              <p className="text-sm text-muted-foreground">Send exactly this amount</p>
            </div>
          </div>
        </div>

        {/* Deposit Address */}
        <div className="space-y-2">
          <Label>Deposit Address</Label>
          <div className="flex items-center gap-2">
            <div className="flex-1 p-3 rounded-lg bg-muted font-mono text-sm break-all">{depositAddress}</div>
            <Button
              variant="outline"
              size="icon"
              onClick={() => copyToClipboard(depositAddress, "address")}
              className="flex-shrink-0"
            >
              {copiedField === "address" ? (
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Memo/Reference */}
        <div className="space-y-2">
          <Label>Memo / Reference (Required)</Label>
          <div className="flex items-center gap-2">
            <div className="flex-1 p-3 rounded-lg bg-muted font-mono text-sm">{memo}</div>
            <Button
              variant="outline"
              size="icon"
              onClick={() => copyToClipboard(memo, "memo")}
              className="flex-shrink-0"
            >
              {copiedField === "memo" ? (
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            This memo is required to identify your transaction. Without it, we cannot process your withdrawal.
          </p>
        </div>

        {/* Request ID */}
        <div className="space-y-2">
          <Label>Request ID</Label>
          <div className="p-3 rounded-lg bg-muted font-mono text-xs text-muted-foreground">{requestId}</div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-3 pt-4">
          <Button variant="outline" size="lg" asChild>
            <a href={`/sell/status/${requestId}`}>Check Status</a>
          </Button>

          {onCancel && (
            <Button variant="ghost" onClick={onCancel}>
              Cancel Request
            </Button>
          )}
        </div>

        {/* Help Text */}
        <p className="text-xs text-center text-muted-foreground">
          After sending, it may take 2-5 minutes for us to detect your deposit. You will be notified when your payout is
          processed.
        </p>
      </CardContent>
    </Card>
  )
}

function Label({ children }: { children: React.ReactNode }) {
  return <label className="text-sm font-medium">{children}</label>
}
