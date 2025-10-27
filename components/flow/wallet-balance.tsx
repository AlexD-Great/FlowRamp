"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { RefreshCw } from "lucide-react"

interface WalletBalanceProps {
  address: string
}

export function WalletBalance({ address }: WalletBalanceProps) {
  const [balance, setBalance] = useState<number>(0)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (address) {
      loadBalance()
    }
  }, [address])

  const loadBalance = async () => {
    setIsLoading(true)
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
      const response = await fetch(`${backendUrl}/api/flow/balance/${address}`);
      if (!response.ok) {
        throw new Error("Failed to fetch balance from backend.");
      }
      const data = await response.json();
      setBalance(parseFloat(data.balance));
    } catch (error) {
      console.error("Failed to load balance:", error)
      setBalance(0); // Reset balance on error
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
            <CardDescription>Your fUSDC balance</CardDescription>
          </div>
          <Button variant="ghost" size="icon" onClick={loadBalance} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between p-3 rounded-lg bg-muted">
          <div>
            <p className="text-sm text-muted-foreground">fUSDC</p>
            <p className="text-2xl font-bold">{balance.toFixed(2)}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Flow USDC</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
