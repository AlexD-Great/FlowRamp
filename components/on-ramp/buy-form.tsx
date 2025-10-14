"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowRight, Wallet, Info } from "lucide-react"
import { SUPPORTED_CURRENCIES, LIMITS } from "@/lib/constants"
import { calculateOnRampTotal, formatCurrency } from "@/lib/utils/conversions"

interface BuyFormProps {
  onSubmit: (data: {
    walletAddress: string
    fiatAmount: number
    fiatCurrency: string
    stablecoin: string
  }) => void
  isLoading?: boolean
}

export function BuyForm({ onSubmit, isLoading }: BuyFormProps) {
  const [walletAddress, setWalletAddress] = useState("")
  const [fiatAmount, setFiatAmount] = useState("")
  const [fiatCurrency] = useState("NGN")
  const [stablecoin, setStablecoin] = useState<"fUSDC" | "fUSDT">("fUSDC")

  const calculation = fiatAmount ? calculateOnRampTotal(Number.parseFloat(fiatAmount), fiatCurrency) : null

  const isValid =
    walletAddress.length > 0 &&
    fiatAmount &&
    Number.parseFloat(fiatAmount) >= LIMITS.MIN_ON_RAMP_NGN &&
    Number.parseFloat(fiatAmount) <= LIMITS.MAX_ON_RAMP_NGN

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (isValid) {
      onSubmit({
        walletAddress,
        fiatAmount: Number.parseFloat(fiatAmount),
        fiatCurrency,
        stablecoin,
      })
    }
  }

  return (
    <Card className="w-full max-w-lg">
      <CardHeader>
        <CardTitle className="text-2xl">Buy Stablecoin</CardTitle>
        <CardDescription>Convert your Nigerian Naira to Flow stablecoins instantly</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Wallet Address */}
          <div className="space-y-2">
            <Label htmlFor="wallet">Flow Wallet Address</Label>
            <div className="relative">
              <Wallet className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="wallet"
                placeholder="0x..."
                value={walletAddress}
                onChange={(e) => setWalletAddress(e.target.value)}
                className="pl-10"
                required
              />
            </div>
            <p className="text-xs text-muted-foreground">Enter your Flow wallet address or connect your wallet</p>
          </div>

          {/* Amount Input */}
          <div className="space-y-2">
            <Label htmlFor="amount">Amount</Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <span className="absolute left-3 top-3 text-sm text-muted-foreground">
                  {SUPPORTED_CURRENCIES.NGN.symbol}
                </span>
                <Input
                  id="amount"
                  type="number"
                  placeholder="10,000"
                  value={fiatAmount}
                  onChange={(e) => setFiatAmount(e.target.value)}
                  className="pl-8"
                  min={LIMITS.MIN_ON_RAMP_NGN}
                  max={LIMITS.MAX_ON_RAMP_NGN}
                  step="100"
                  required
                />
              </div>
              <Select value={fiatCurrency} disabled>
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NGN">NGN</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <p className="text-xs text-muted-foreground">
              Min: {formatCurrency(LIMITS.MIN_ON_RAMP_NGN, "NGN")} • Max:{" "}
              {formatCurrency(LIMITS.MAX_ON_RAMP_NGN, "NGN")}
            </p>
          </div>

          {/* Stablecoin Selection */}
          <div className="space-y-2">
            <Label htmlFor="stablecoin">Receive</Label>
            <Select value={stablecoin} onValueChange={(v) => setStablecoin(v as "fUSDC" | "fUSDT")}>
              <SelectTrigger id="stablecoin">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="fUSDC">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">fUSDC</span>
                    <span className="text-xs text-muted-foreground">Flow USDC</span>
                  </div>
                </SelectItem>
                <SelectItem value="fUSDT">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">fUSDT</span>
                    <span className="text-xs text-muted-foreground">Flow USDT</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Calculation Summary */}
          {calculation && (
            <div className="rounded-lg bg-muted p-4 space-y-2">
              <div className="flex items-start gap-2">
                <Info className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div className="flex-1 space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">USD Amount</span>
                    <span className="font-medium">{formatCurrency(calculation.usdAmount, "USD")}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Fee (1.5%)</span>
                    <span className="font-medium">{formatCurrency(calculation.fee, "USD")}</span>
                  </div>
                  <div className="h-px bg-border my-2" />
                  <div className="flex justify-between text-base">
                    <span className="font-medium">You will receive</span>
                    <span className="font-bold text-primary">
                      {calculation.finalAmount.toFixed(2)} {stablecoin}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <Button type="submit" className="w-full" size="lg" disabled={!isValid || isLoading}>
            {isLoading ? (
              "Processing..."
            ) : (
              <>
                Continue to Payment
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
