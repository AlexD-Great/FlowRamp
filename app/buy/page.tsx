"use client"

import { useState, useEffect } from "react"
import { BuyForm } from "@/components/on-ramp/buy-form"
import { PaymentStatus } from "@/components/on-ramp/payment-status"
import { TransactionHistory } from "@/components/on-ramp/transaction-history"
import { useAuth } from "@/lib/firebase/auth"
import { useToast } from "@/components/ui/use-toast"
import type { OnRampSession } from "@/lib/types/database"

export default function BuyPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [currentSession, setCurrentSession] = useState<OnRampSession | null>(null)
  const [sessions, setSessions] = useState<OnRampSession[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [jwt, setJwt] = useState<string | null>(null);
  const [lastNotifiedStatus, setLastNotifiedStatus] = useState<string | null>(null);
  const [connectedWallet, setConnectedWallet] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      user.getIdToken().then(setJwt);
      loadSessions();
    }
    
    // Load connected wallet from localStorage
    const savedWallet = localStorage.getItem('flow_wallet_address');
    if (savedWallet) {
      setConnectedWallet(savedWallet);
    }
    
    // Listen for wallet connection events
    const handleWalletConnect = (e: CustomEvent) => {
      if (e.detail?.address) {
        setConnectedWallet(e.detail.address);
        localStorage.setItem('flow_wallet_address', e.detail.address);
      }
    };
    
    window.addEventListener('wallet:connected' as any, handleWalletConnect);
    
    return () => {
      window.removeEventListener('wallet:connected' as any, handleWalletConnect);
    };
  }, [user]);

  // Poll for session updates when processing
  useEffect(() => {
    if (currentSession && (currentSession.status === "processing" || currentSession.status === "paid")) {
      const interval = setInterval(() => {
        pollSessionStatus(currentSession.id)
      }, 3000)

      return () => clearInterval(interval)
    }
  }, [currentSession])

  const getAuthHeaders = (): HeadersInit | undefined => {
    if (!jwt) {
      return undefined;
    }
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${jwt}`,
    };
  };

  const loadSessions = async () => {
    if (!jwt) return;
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/onramp/sessions`, {
        headers: getAuthHeaders(),
      });
      if (response.ok) {
        const data = await response.json()
        setSessions(data.sessions || [])
      }
    } catch (error) {
      console.error("[v0] Failed to load sessions:", error)
    }
  }

  const pollSessionStatus = async (sessionId: string) => {
    if (!jwt) return;
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/onramp/session/${sessionId}`, {
        headers: getAuthHeaders(),
      });
      if (response.ok) {
        const data = await response.json()
        setCurrentSession(data)

        // Show toast notifications for status changes
        if (data.status === "completed" && lastNotifiedStatus !== "completed") {
          setLastNotifiedStatus("completed");
          toast({
            title: "🎉 Purchase Successful!",
            description: `${data.usdAmount.toFixed(2)} FLOW tokens have been sent to your wallet. Check your wallet balance!`,
            variant: "default",
          });
        } else if (data.status === "failed" && lastNotifiedStatus !== "failed") {
          setLastNotifiedStatus("failed");
          toast({
            title: "❌ Transaction Failed",
            description: "Your purchase could not be completed. Please contact support if you were charged.",
            variant: "destructive",
          });
        }

        // Reload history when completed
        if (data.status === "completed" || data.status === "failed") {
          loadSessions()
        }
      }
    } catch (error) {
      console.error("[v0] Failed to poll session:", error)
    }
  }

  const handleSubmit = async (formData: {
    walletAddress: string
    fiatAmount: number
    fiatCurrency: string
    stablecoin: string
  }) => {
    if (!jwt) {
      alert("Please sign in to continue.");
      return;
    }
    setIsLoading(true)

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/onramp/create-session`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          walletAddress: formData.walletAddress,
          fiatCurrency: formData.fiatCurrency,
          fiatAmount: formData.fiatAmount,
          preferredStablecoin: formData.stablecoin,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to create session")
      }

      const data = await response.json()

      // In production, redirect to payment URL
      // For demo, simulate payment flow
      if (data.paymentUrl) {
        // Open payment URL in new window
        window.open(data.paymentUrl, "_blank")
      }

      // Fetch the created session
      const sessionResponse = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/onramp/session/${data.sessionId}`, {
        headers: getAuthHeaders(),
      });
      if (sessionResponse.ok) {
        const sessionData = await sessionResponse.json()
        setCurrentSession(sessionData)
      }
    } catch (error) {
      console.error("[v0] Failed to create session:", error)
      alert("Failed to create session. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleReset = () => {
    setCurrentSession(null)
    setLastNotifiedStatus(null)
    loadSessions()
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4 text-balance">Buy Flow Stablecoins</h1>
          <p className="text-lg text-muted-foreground text-balance max-w-2xl mx-auto">
            Convert your Nigerian Naira to Flow stablecoins instantly and securely
          </p>
        </div>

        {/* Main Content */}
        <div className="flex flex-col items-center gap-8">
          {currentSession ? (
            <PaymentStatus
              status={currentSession.status}
              sessionId={currentSession.id}
              txHash={currentSession.txHash}
              receiptCID={currentSession.receiptCID}
              amount={currentSession.usdAmount}
              stablecoin={currentSession.stablecoin}
              onReset={handleReset}
            />
          ) : (
            <BuyForm 
              onSubmit={handleSubmit} 
              isLoading={isLoading}
              defaultWalletAddress={connectedWallet || undefined}
            />
          )}

          {/* Transaction History */}
          {sessions.length > 0 && !currentSession && (
            <div className="w-full max-w-2xl">
              <TransactionHistory sessions={sessions} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
