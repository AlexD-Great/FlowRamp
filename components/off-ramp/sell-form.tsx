"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { ArrowRight, Wallet, Info, Building2, Smartphone } from "lucide-react"
import { LIMITS } from "@/lib/constants"
import { calculateOffRampTotal, formatCurrency } from "@/lib/utils/conversions"

interface SellFormProps {
  onSubmit: (data: {
    walletAddress: string
    amount: number
    stablecoin: string
    payoutMethod: "bank_transfer" | "mobile_money"
    payoutDetails: {
      bank?: string
      accountNumber?: string
      accountName?: string
      phoneNumber?: string
    }
  }) => void
  isLoading?: boolean
}

export function SellForm({ onSubmit, isLoading }: SellFormProps) {
  const [walletAddress, setWalletAddress] = useState("")
  const [amount, setAmount] = useState("")
  const [stablecoin, setStablecoin] = useState<"fUSDC" | "fUSDT">("fUSDC")
  const [payoutMethod, setPayoutMethod] = useState<"bank_transfer" | "mobile_money">("bank_transfer")

  // Bank transfer fields
  const [bank, setBank] = useState("")
  const [accountNumber, setAccountNumber] = useState("")
  const [accountName, setAccountName] = useState("")

  // Mobile money fields
  const [phoneNumber, setPhoneNumber] = useState("")

  const calculation = amount ? calculateOffRampTotal(Number.parseFloat(amount), "NGN") : null

  const isValid =
    walletAddress.length > 0 &&
    amount &&
    Number.parseFloat(amount) >= LIMITS.MIN_OFF_RAMP_USD &&
    Number.parseFloat(amount) <= LIMITS.MAX_OFF_RAMP_USD &&
    (payoutMethod === "bank_transfer"
      ? bank && accountNumber && accountName
      : payoutMethod === "mobile_money"
        ? phoneNumber
        : false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (isValid) {
      onSubmit({
        walletAddress,
        amount: Number.parseFloat(amount),
        stablecoin,
        payoutMethod,
        payoutDetails: payoutMethod === "bank_transfer" ? { bank, accountNumber, accountName } : { phoneNumber },
      })
    }
  }

  return (
    <Card className="w-full max-w-lg">
      <CardHeader>
        <CardTitle className="text-2xl">Sell Stablecoin</CardTitle>
        <CardDescription>Convert your Flow stablecoins to Nigerian Naira</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Wallet Address */}
          <div className="space-y-2">
            <Label htmlFor="wallet">Your Flow Wallet Address</Label>
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
            <p className="text-xs text-muted-foreground">The wallet you'll send stablecoins from</p>
          </div>

          {/* Amount Input */}
          <div className="space-y-2">
            <Label htmlFor="amount">Amount to Sell</Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  id="amount"
                  type="number"
                  placeholder="100.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  min={LIMITS.MIN_OFF_RAMP_USD}
                  max={LIMITS.MAX_OFF_RAMP_USD}
                  step="0.01"
                  required
                />
              </div>
              <Select value={stablecoin} onValueChange={(v) => setStablecoin(v as "fUSDC" | "fUSDT")}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fUSDC">fUSDC</SelectItem>
                  <SelectItem value="fUSDT">fUSDT</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <p className="text-xs text-muted-foreground">
              Min: ${LIMITS.MIN_OFF_RAMP_USD} • Max: ${LIMITS.MAX_OFF_RAMP_USD.toLocaleString()}
            </p>
          </div>

          {/* Payout Method */}
          <div className="space-y-3">
            <Label>Payout Method</Label>
            <RadioGroup value={payoutMethod} onValueChange={(v) => setPayoutMethod(v as any)}>
              <div className="flex items-center space-x-2 rounded-lg border p-4 cursor-pointer hover:bg-muted/50">
                <RadioGroupItem value="bank_transfer" id="bank" />
                <Label htmlFor="bank" className="flex items-center gap-2 cursor-pointer flex-1">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Bank Transfer</p>
                    <p className="text-xs text-muted-foreground">Receive NGN directly to your bank account</p>
                  </div>
                </Label>
              </div>
              <div className="flex items-center space-x-2 rounded-lg border p-4 cursor-pointer hover:bg-muted/50">
                <RadioGroupItem value="mobile_money" id="mobile" />
                <Label htmlFor="mobile" className="flex items-center gap-2 cursor-pointer flex-1">
                  <Smartphone className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Mobile Money</p>
                    <p className="text-xs text-muted-foreground">Receive via mobile money transfer</p>
                  </div>
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Bank Transfer Details */}
          {payoutMethod === "bank_transfer" && (
            <div className="space-y-4 p-4 rounded-lg bg-muted/50">
              <div className="space-y-2">
                <Label htmlFor="bank">Bank Name</Label>
                <Select value={bank} onValueChange={setBank} required>
                  <SelectTrigger id="bank">
                    <SelectValue placeholder="Select your bank" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="GTBank">GTBank</SelectItem>
                    <SelectItem value="Access Bank">Access Bank</SelectItem>
                    <SelectItem value="First Bank">First Bank</SelectItem>
                    <SelectItem value="Zenith Bank">Zenith Bank</SelectItem>
                    <SelectItem value="UBA">UBA</SelectItem>
                    <SelectItem value="Ecobank">Ecobank</SelectItem>
                    <SelectItem value="Stanbic IBTC">Stanbic IBTC</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="accountNumber">Account Number</Label>
                <Input
                  id="accountNumber"
                  placeholder="0123456789"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  maxLength={10}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="accountName">Account Name</Label>
                <Input
                  id="accountName"
                  placeholder="John Doe"
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
                  required
                />
              </div>
            </div>
          )}

          {/* Mobile Money Details */}
          {payoutMethod === "mobile_money" && (
            <div className="space-y-4 p-4 rounded-lg bg-muted/50">
              <div className="space-y-2">
                <Label htmlFor="phoneNumber">Phone Number</Label>
                <Input
                  id="phoneNumber"
                  type="tel"
                  placeholder="+234 800 000 0000"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  required
                />
                <p className="text-xs text-muted-foreground">Enter your mobile money registered number</p>
              </div>
            </div>
          )}

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
                    <span className="font-bold text-primary">{formatCurrency(calculation.fiatAmount, "NGN")}</span>
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
                Continue
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
