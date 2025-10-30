"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Wallet, LogOut, Copy, CheckCircle2 } from "lucide-react"
import { FCLClient, type FlowUser } from "@/lib/flow/fcl-client"
import { useAuth } from "@/lib/firebase/auth"

export function WalletConnect() {
  const { user: firebaseUser } = useAuth()
  const [user, setUser] = useState<FlowUser | null>(null)
  const [isConnecting, setIsConnecting] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    // Initialize FCL and check for existing session
    const initFCL = async () => {
      const fcl = FCLClient.getInstance()
      await fcl.initialize()
      const currentUser = await fcl.getCurrentUser()
      if (currentUser.loggedIn) {
        setUser(currentUser)
      }
    }

    initFCL()
  }, [])

  const handleConnect = async () => {
    setIsConnecting(true)
    try {
      const fcl = FCLClient.getInstance()
      const authenticatedUser = await fcl.authenticate()
      setUser(authenticatedUser)

      // After successful authentication, request signature verification
      if (authenticatedUser.loggedIn) {
        setIsVerifying(true)
        try {
          const verification = await fcl.verifyWalletOwnership()
          if (verification) {
            console.log("Wallet ownership verified:", verification)
            
            // Send verification to backend if user is authenticated
            if (firebaseUser) {
              try {
                const token = await firebaseUser.getIdToken()
                const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/wallet/verify`, {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                  },
                  body: JSON.stringify({
                    address: authenticatedUser.addr,
                    signature: verification.signature,
                    message: verification.message,
                  }),
                })
                
                if (response.ok) {
                  console.log("Backend verification successful")
                } else {
                  console.warn("Backend verification failed, but wallet is still connected")
                }
              } catch (backendError) {
                console.error("Backend verification error:", backendError)
                // Continue anyway - signature was verified client-side
              }
            }
          }
        } catch (verifyError) {
          console.error("Verification failed:", verifyError)
          // User rejected signature or verification failed
          // You can decide whether to disconnect or just warn the user
          alert("Wallet verification was not completed. Please sign the message to verify wallet ownership.")
        } finally {
          setIsVerifying(false)
        }
      }
    } catch (error) {
      console.error("Wallet connection failed:", error)
      alert("Failed to connect wallet. Please try again.")
    } finally {
      setIsConnecting(false)
    }
  }

  const handleDisconnect = async () => {
    try {
      const fcl = FCLClient.getInstance()
      await fcl.unauthenticate()
      setUser(null)
    } catch (error) {
      console.error("Wallet disconnection failed:", error)
    }
  }

  const copyAddress = () => {
    if (user?.addr) {
      navigator.clipboard.writeText(user.addr)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  if (user?.loggedIn && user.addr) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Connected Wallet</CardTitle>
          <CardDescription>Your Flow wallet is connected</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted">
            <div className="flex items-center gap-2">
              <Wallet className="h-4 w-4 text-primary" />
              <span className="font-mono text-sm">
                {user.addr.slice(0, 8)}...{user.addr.slice(-6)}
              </span>
            </div>
            <Button variant="ghost" size="icon" onClick={copyAddress}>
              {copied ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>

          <Button variant="outline" onClick={handleDisconnect} className="w-full bg-transparent">
            <LogOut className="mr-2 h-4 w-4" />
            Disconnect
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Connect Wallet</CardTitle>
        <CardDescription>Connect your Flow wallet to get started</CardDescription>
      </CardHeader>
      <CardContent>
        <Button onClick={handleConnect} disabled={isConnecting || isVerifying} className="w-full" size="lg">
          <Wallet className="mr-2 h-5 w-5" />
          {isVerifying ? "Verifying Ownership..." : isConnecting ? "Connecting..." : "Connect Flow Wallet"}
        </Button>
        <p className="text-xs text-muted-foreground text-center mt-4">
          {isVerifying 
            ? "Please sign the message in your wallet to verify ownership"
            : "Supports Blocto, Lilico, and other Flow wallets"}
        </p>
      </CardContent>
    </Card>
  )
}
