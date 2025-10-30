"use client"

import { WalletConnect } from "@/components/flow/wallet-connect"
import { WalletBalance } from "@/components/flow/wallet-balance"
import { useState, useEffect } from "react"
import { FCLClient, type FlowUser } from "@/lib/flow/fcl-client"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowRight } from "lucide-react"

export default function WalletPage() {
  const [user, setUser] = useState<FlowUser | null>(null)

  useEffect(() => {
    const checkUser = async () => {
      const fcl = FCLClient.getInstance()
      const currentUser = await fcl.getCurrentUser()
      setUser(currentUser)
      
      // Save wallet address to localStorage and dispatch event
      if (currentUser?.loggedIn && currentUser.addr) {
        localStorage.setItem('flow_wallet_address', currentUser.addr);
        
        // Dispatch custom event for other pages to listen
        const event = new CustomEvent('wallet:connected', {
          detail: { address: currentUser.addr }
        });
        window.dispatchEvent(event);
      } else {
        localStorage.removeItem('flow_wallet_address');
      }
    }

    checkUser()

    // Poll for user changes
    const interval = setInterval(checkUser, 2000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4 text-balance">Flow Wallet</h1>
          <p className="text-lg text-muted-foreground text-balance max-w-2xl mx-auto">
            Connect your Flow wallet to manage your stablecoins
          </p>
        </div>

        {/* Main Content */}
        <div className="max-w-2xl mx-auto space-y-6">
          <WalletConnect />

          {user?.loggedIn && user.addr && (
            <>
              <WalletBalance address={user.addr} />

              {/* Quick Actions */}
              <div className="grid md:grid-cols-2 gap-4">
                <Button asChild size="lg" className="h-auto py-6">
                  <Link href="/buy" className="flex flex-col items-center gap-2">
                    <span className="text-lg font-semibold">Buy Stablecoins</span>
                    <span className="text-sm opacity-80">Convert NGN to fUSDC/fUSDT</span>
                    <ArrowRight className="h-5 w-5 mt-2" />
                  </Link>
                </Button>

                <Button asChild variant="outline" size="lg" className="h-auto py-6 bg-transparent">
                  <Link href="/sell" className="flex flex-col items-center gap-2">
                    <span className="text-lg font-semibold">Sell Stablecoins</span>
                    <span className="text-sm opacity-80">Convert fUSDC/fUSDT to NGN</span>
                    <ArrowRight className="h-5 w-5 mt-2" />
                  </Link>
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
