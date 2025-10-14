"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { RefreshCw } from "lucide-react"
import { FCLClient } from "@/lib/flow/fcl-client"

interface WalletBalanceProps {
  address: string
}

export function WalletBalance({ address }: WalletBalanceProps) {
  const [balances, setBalances] = useState<{
    fUSDC: number
    fUSDT: number
  }>({
    fUSDC: 0,
    fUSDT: 0,
  })
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (address) {
      loadBalances()
    }
  }, [address])

  const loadBalances = async () => {
    setIsLoading(true)
    try {
      const fcl = FCLClient.getInstance()

      // Mock balance fetching - in production, execute Cadence scripts
      // const fUSDCBalance = await fcl.executeScript(CadenceScripts.getBalance(address, 'fUSDC'))
      // const fUSDTBalance = await fcl.executeScript(CadenceScripts.getBalance(address, 'fUSDT'))

      // Simulate balances
      await new Promise((resolve) => setTimeout(resolve, 1000))

      setBalances({
        fUSDC: Math.random() * 1000,
        fUSDT: Math.random() * 500,
      })
    } catch (error) {
      console.error("[v0] Failed to load balances:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">Wallet Balance</CardTitle>
            <CardDescription>Your Flow stablecoin balances</CardDescription>
          </div>
          <Button variant="ghost" size="icon" onClick={loadBalances} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between p-3 rounded-lg bg-muted">
          <div>
            <p className="text-sm text-muted-foreground">fUSDC</p>
            <p className="text-2xl font-bold">{balances.fUSDC.toFixed(2)}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Flow USDC</p>
          </div>
        </div>

        <div className="flex items-center justify-between p-3 rounded-lg bg-muted">
          <div>
            <p className="text-sm text-muted-foreground">fUSDT</p>
            <p className="text-2xl font-bold">{balances.fUSDT.toFixed(2)}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Flow USDT</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
