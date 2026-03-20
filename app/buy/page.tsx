"use client"

import { useState, useEffect, useCallback, Suspense } from "react"
import { useAuth, signInWithEmail, signInWithGoogle, signUpWithEmail } from "@/lib/firebase/auth"
import { useSearchParams } from "next/navigation"
import { toast } from "sonner"
import { BackButton } from "@/components/ui/back-button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Copy, CheckCircle2, Clock, XCircle, Banknote, Wallet, RefreshCw, AlertCircle, Zap, LogIn, UserPlus, Loader2, CreditCard, ShieldCheck } from "lucide-react"

type ViewState = "form" | "paying" | "pending" | "history"

interface Session {
  id: string
  status: string
  fiatAmount: number
  estimatedFLOW: number
  flowNGNRate: number
  walletAddress: string
  paymentRef?: string
  txHash?: string
  flowSent?: number
  rejectionReason?: string
  createdAt: string
  completedAt?: string
}

interface SessionCreateData {
  sessionId: string
  authorizationUrl: string
  accessCode: string
  paymentRef: string
  estimatedFLOW: number
  flowNGNRate: number
  ngnAmount: number
}

const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  awaiting_payment: { label: "Awaiting Payment", color: "bg-yellow-100 text-yellow-800 border-yellow-200", icon: <Clock className="h-3 w-3" /> },
  awaiting_admin_approval: { label: "Payment Confirmed", color: "bg-blue-100 text-blue-800 border-blue-200", icon: <ShieldCheck className="h-3 w-3" /> },
  processing: { label: "Processing", color: "bg-purple-100 text-purple-800 border-purple-200", icon: <RefreshCw className="h-3 w-3 animate-spin" /> },
  completed: { label: "Completed", color: "bg-green-100 text-green-800 border-green-200", icon: <CheckCircle2 className="h-3 w-3" /> },
  rejected: { label: "Rejected", color: "bg-red-100 text-red-800 border-red-200", icon: <XCircle className="h-3 w-3" /> },
  failed: { label: "Failed", color: "bg-red-100 text-red-800 border-red-200", icon: <XCircle className="h-3 w-3" /> },
}

function AuthGate() {
  const [mode, setMode] = useState<"signin" | "signup">("signin")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleEmailAuth = async () => {
    if (!email || !password) { toast.error("Enter your email and password"); return }
    setIsLoading(true)
    const fn = mode === "signin" ? signInWithEmail : signUpWithEmail
    const { error } = await fn(email, password)
    if (error) toast.error(error)
    else toast.success(mode === "signin" ? "Signed in!" : "Account created!")
    setIsLoading(false)
  }

  const handleGoogle = async () => {
    setIsLoading(true)
    const { error } = await signInWithGoogle()
    if (error) toast.error(error)
    setIsLoading(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 flex items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2 text-2xl">
            {mode === "signin" ? <LogIn className="h-6 w-6" /> : <UserPlus className="h-6 w-6" />}
            {mode === "signin" ? "Sign in to Buy FLOW" : "Create an account"}
          </CardTitle>
          <CardDescription>
            {mode === "signin"
              ? "You must be signed in to purchase FLOW tokens."
              : "Create an account to start buying FLOW tokens."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button variant="outline" className="w-full" onClick={handleGoogle} disabled={isLoading}>
            {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : (
              <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
            )}
            Continue with Google
          </Button>

          <div className="flex items-center gap-3">
            <Separator className="flex-1" />
            <span className="text-xs text-muted-foreground">or</span>
            <Separator className="flex-1" />
          </div>

          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Password</Label>
              <Input type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleEmailAuth()} />
            </div>
          </div>

          <Button className="w-full" onClick={handleEmailAuth} disabled={isLoading}>
            {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
            {mode === "signin" ? "Sign In" : "Create Account"}
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            {mode === "signin" ? "Don't have an account? " : "Already have an account? "}
            <button className="text-primary underline" onClick={() => setMode(mode === "signin" ? "signup" : "signin")}>
              {mode === "signin" ? "Sign up" : "Sign in"}
            </button>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

function BuyPageContent() {
  const { user, loading } = useAuth()
  const searchParams = useSearchParams()
  const [viewState, setViewState] = useState<ViewState>("form")
  const [sessions, setSessions] = useState<Session[]>([])
  const [currentSession, setCurrentSession] = useState<Session | null>(null)
  const [sessionCreateData, setSessionCreateData] = useState<SessionCreateData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isFetchingSessions, setIsFetchingSessions] = useState(false)
  const [walletAddress, setWalletAddress] = useState("")
  const [ngnAmount, setNgnAmount] = useState("")

  const [vaultStatus, setVaultStatus] = useState<"unchecked" | "checking" | "ok" | "missing">("unchecked")

  const flowRate = sessionCreateData?.flowNGNRate || 2000
  const estimatedFLOW = ngnAmount ? parseFloat((parseFloat(ngnAmount) / flowRate).toFixed(4)) : 0

  const getAuthHeaders = useCallback(async (): Promise<HeadersInit | undefined> => {
    if (!user) return undefined
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${await user.getIdToken()}`,
    }
  }, [user])

  const loadSessions = useCallback(async () => {
    if (!user) return
    setIsFetchingSessions(true)
    try {
      const headers = await getAuthHeaders()
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/onramp/sessions`, { headers })
      if (res.ok) {
        const data = await res.json()
        setSessions(data.sessions || [])
      }
    } catch (e) {
      console.error("Failed to load sessions:", e)
    } finally {
      setIsFetchingSessions(false)
    }
  }, [user, getAuthHeaders])

  useEffect(() => {
    if (user) {
      loadSessions()
      const saved = localStorage.getItem("flow_wallet_address")
      if (saved) setWalletAddress(saved)
    }
  }, [user, loadSessions])

  // Handle Paystack callback redirect
  useEffect(() => {
    const status = searchParams.get("status")
    const reference = searchParams.get("reference") || searchParams.get("trxref")
    if (status === "callback" && reference && user) {
      // Find the session and verify payment
      verifyPaymentByRef(reference)
    }
  }, [searchParams, user])

  // Poll current session if pending
  useEffect(() => {
    if (currentSession && ["awaiting_admin_approval", "processing"].includes(currentSession.status)) {
      const interval = setInterval(() => pollSession(currentSession.id), 8000)
      return () => clearInterval(interval)
    }
  }, [currentSession])

  // Reset vault status when address changes
  useEffect(() => {
    setVaultStatus("unchecked")
  }, [walletAddress])

  const verifyPaymentByRef = async (reference: string) => {
    // Find session with this payment reference
    try {
      const headers = await getAuthHeaders()
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/onramp/sessions`, { headers })
      if (res.ok) {
        const data = await res.json()
        const session = (data.sessions || []).find((s: Session) => s.paymentRef === reference)
        if (session) {
          // Verify payment
          const verifyRes = await fetch(
            `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/onramp/verify-payment/${session.id}`,
            { headers }
          )
          if (verifyRes.ok) {
            const result = await verifyRes.json()
            setCurrentSession({ ...session, status: result.status })
            setViewState("pending")
            toast.success("Payment confirmed! Your FLOW will be sent shortly.")
          }
          loadSessions()
        }
      }
    } catch (e) {
      console.error("Verify payment by ref error:", e)
    }
  }

  const pollSession = async (sessionId: string) => {
    if (!user) return
    try {
      const headers = await getAuthHeaders()
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/onramp/session/${sessionId}`, { headers })
      if (res.ok) {
        const data = await res.json()
        setCurrentSession(data)
        if (data.status === "completed") {
          toast.success("FLOW tokens sent to your wallet!", { description: `${data.flowSent || data.estimatedFLOW} FLOW deposited.` })
          loadSessions()
        } else if (data.status === "rejected") {
          toast.error("Your request was rejected.", { description: data.rejectionReason || "Contact support for details." })
          loadSessions()
        }
      }
    } catch (e) {
      console.error("Failed to poll session:", e)
    }
  }

  const checkVault = async () => {
    if (!walletAddress || !walletAddress.startsWith("0x")) return
    setVaultStatus("checking")
    try {
      const headers = await getAuthHeaders()
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/onramp/check-vault/${walletAddress}`, { headers })
      if (res.ok) {
        const data = await res.json()
        setVaultStatus(data.hasVault ? "ok" : "missing")
        if (!data.hasVault) toast.error("This wallet doesn't have a FLOW token vault set up.", { duration: 6000 })
      } else {
        setVaultStatus("unchecked")
      }
    } catch {
      setVaultStatus("unchecked")
    }
  }

  const handleCreateSession = async () => {
    if (!user) { toast.error("Please sign in to continue."); return }
    if (!walletAddress || !walletAddress.startsWith("0x")) {
      toast.error("Please enter a valid Flow wallet address (starts with 0x)")
      return
    }
    if (vaultStatus === "missing") {
      toast.error("Cannot proceed: the wallet address doesn't have a FLOW token vault set up.")
      return
    }
    const amount = parseFloat(ngnAmount)
    if (!ngnAmount || isNaN(amount) || amount < 1000) {
      toast.error("Minimum amount is ₦1,000")
      return
    }
    setIsLoading(true)
    try {
      const headers = await getAuthHeaders()
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/onramp/create-session`, {
        method: "POST",
        headers,
        body: JSON.stringify({ walletAddress, fiatAmount: amount }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Failed to create session")
      }
      const data: SessionCreateData = await res.json()
      setSessionCreateData(data)
      localStorage.setItem("flow_wallet_address", walletAddress)

      // Open Paystack payment page
      window.location.href = data.authorizationUrl
    } catch (e: any) {
      toast.error(e.message || "Failed to create session. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleReset = () => {
    setCurrentSession(null)
    setSessionCreateData(null)
    setViewState("form")
    loadSessions()
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!user) return <AuthGate />

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto px-4 py-12 max-w-2xl">
        <div className="mb-6"><BackButton href="/" /></div>

        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold mb-3">Buy FLOW</h1>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Pay with your card or bank account via Paystack and receive FLOW in your wallet.
          </p>
        </div>

        {/* STEP 1: Amount & Wallet Form */}
        {viewState === "form" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><CreditCard className="h-5 w-5" /> Buy FLOW with NGN</CardTitle>
              <CardDescription>Enter the amount you want to spend and your FLOW wallet address. You'll pay securely via Paystack.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label>FLOW Wallet Address</Label>
                <div className="flex items-center gap-2">
                  <Wallet className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <Input
                    placeholder="0x..."
                    value={walletAddress}
                    onChange={e => setWalletAddress(e.target.value)}
                    onBlur={() => walletAddress.startsWith("0x") && walletAddress.length > 5 && checkVault()}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="flex-shrink-0"
                    onClick={checkVault}
                    disabled={!walletAddress.startsWith("0x") || vaultStatus === "checking"}
                  >
                    {vaultStatus === "checking" ? <Loader2 className="h-4 w-4 animate-spin" /> : "Check"}
                  </Button>
                </div>
                {vaultStatus === "ok" && (
                  <p className="text-xs text-green-700 flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5" /> Wallet verified — ready to receive FLOW</p>
                )}
                {vaultStatus === "missing" && (
                  <p className="text-xs text-red-600 flex items-center gap-1"><AlertCircle className="h-3.5 w-3.5" /> Wallet not set up for FLOW. Please initialize your Flow wallet first.</p>
                )}
                {vaultStatus === "unchecked" && (
                  <p className="text-xs text-muted-foreground">FLOW tokens will be sent to this address after payment. Click Check to verify.</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Amount (NGN)</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">₦</span>
                  <Input
                    type="number"
                    placeholder="10,000"
                    className="pl-8"
                    value={ngnAmount}
                    onChange={e => setNgnAmount(e.target.value)}
                    min={1000}
                  />
                </div>
                <p className="text-xs text-muted-foreground">Minimum: ₦1,000 · Maximum: ₦5,000,000</p>
              </div>

              {ngnAmount && parseFloat(ngnAmount) >= 1000 && (
                <div className="bg-muted/60 rounded-lg p-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">You Pay</span>
                    <span className="font-semibold">₦{parseFloat(ngnAmount).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Rate</span>
                    <span>₦{flowRate.toLocaleString()} / FLOW</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-base font-bold">
                    <span>You Receive (est.)</span>
                    <span className="text-green-600">~{estimatedFLOW} FLOW</span>
                  </div>
                </div>
              )}

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800 flex items-start gap-2">
                <ShieldCheck className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>Payments are processed securely via <strong>Paystack</strong>. You can pay with your debit card, bank transfer, or USSD.</span>
              </div>

              <Button className="w-full" size="lg" onClick={handleCreateSession} disabled={isLoading}>
                {isLoading ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Initializing Payment...</>
                ) : (
                  <><CreditCard className="h-4 w-4 mr-2" /> Pay with Paystack</>
                )}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Pending / Status View */}
        {viewState === "pending" && currentSession && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {currentSession.status === "completed" ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                ) : (
                  <Clock className="h-5 w-5 text-blue-600" />
                )}
                {currentSession.status === "completed" ? "Order Complete" : "Order In Progress"}
              </CardTitle>
              <CardDescription>
                {currentSession.status === "completed"
                  ? "Your FLOW tokens have been sent to your wallet."
                  : "Your payment has been confirmed. FLOW will be sent to your wallet shortly."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Order ID</span>
                  <span className="font-mono text-xs">{currentSession.id.substring(0, 16)}...</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Amount Paid</span>
                  <span className="font-semibold">₦{currentSession.fiatAmount?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Expected FLOW</span>
                  <span className="font-semibold text-green-700">~{currentSession.estimatedFLOW} FLOW</span>
                </div>
                <div className="flex justify-between text-sm items-center">
                  <span className="text-muted-foreground">Status</span>
                  {(() => {
                    const cfg = statusConfig[currentSession.status] || statusConfig.awaiting_admin_approval
                    return (
                      <span className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs border font-medium ${cfg.color}`}>
                        {cfg.icon} {cfg.label}
                      </span>
                    )
                  })()}
                </div>
              </div>

              {currentSession.status === "completed" && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
                  <CheckCircle2 className="h-8 w-8 text-green-600 mx-auto mb-2" />
                  <p className="font-bold text-green-700 text-lg">FLOW Sent!</p>
                  <p className="text-sm text-muted-foreground">{currentSession.flowSent || currentSession.estimatedFLOW} FLOW deposited to your wallet.</p>
                  {currentSession.txHash && (
                    <p className="text-xs font-mono mt-2 text-muted-foreground break-all">Tx: {currentSession.txHash}</p>
                  )}
                </div>
              )}

              {currentSession.status === "rejected" && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                  <XCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
                  <p className="font-bold text-red-700 text-center">Request Rejected</p>
                  {currentSession.rejectionReason && (
                    <p className="text-sm text-center text-muted-foreground mt-1">{currentSession.rejectionReason}</p>
                  )}
                </div>
              )}

              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => pollSession(currentSession.id)}>
                  <RefreshCw className="h-4 w-4 mr-2" /> Refresh Status
                </Button>
                <Button variant="outline" className="flex-1" onClick={handleReset}>
                  New Order
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Deposit History */}
        {sessions.length > 0 && (
          <div className="mt-10 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">Purchase History</h2>
              <Button variant="ghost" size="sm" onClick={loadSessions} disabled={isFetchingSessions}>
                <RefreshCw className={`h-4 w-4 mr-1 ${isFetchingSessions ? "animate-spin" : ""}`} /> Refresh
              </Button>
            </div>
            <div className="space-y-3">
              {sessions.map(session => {
                const cfg = statusConfig[session.status] || { label: session.status, color: "bg-gray-100 text-gray-800 border-gray-200", icon: null }
                return (
                  <Card
                    key={session.id}
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => { setCurrentSession(session); setViewState("pending") }}
                  >
                    <CardContent className="py-4 flex items-center justify-between">
                      <div>
                        <p className="font-semibold">₦{session.fiatAmount?.toLocaleString()} → ~{session.estimatedFLOW} FLOW</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{new Date(session.createdAt).toLocaleString()}</p>
                      </div>
                      <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs border font-medium ${cfg.color}`}>
                        {cfg.icon} {cfg.label}
                      </span>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function BuyPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>}>
      <BuyPageContent />
    </Suspense>
  )
}
