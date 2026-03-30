"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useAuth, signInWithEmail, signInWithGoogle, signUpWithEmail } from "@/lib/firebase/auth"
import { toast } from "sonner"
import { BackButton } from "@/components/ui/back-button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import {
  Copy, CheckCircle2, Clock, XCircle, Upload, RefreshCw,
  ImageIcon, AlertCircle, Landmark, ArrowRightLeft, Wallet, LogIn, UserPlus, Loader2, ShieldCheck
} from "lucide-react"

type ViewState = "form" | "deposit" | "proof" | "pending"

interface Bank {
  name: string
  code: string
}

interface BankDetails {
  account_number: string
  account_name: string
  bank_name: string
  bank_code: string
}

interface Request {
  id: string
  status: string
  amount: number
  estimatedNGN: number
  flowNGNRate: number
  walletAddress: string
  adminFlowAddress?: string
  payoutDetails?: BankDetails
  proofUrl?: string
  txHash?: string
  ngnSent?: number
  paymentReference?: string
  rejectionReason?: string
  createdAt: string
  completedAt?: string
}

interface RequestCreateData {
  requestId: string
  adminFlowAddress: string
  estimatedNGN: number
  flowNGNRate: number
  flowAmount: number
}

const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  awaiting_flow_deposit: { label: "Awaiting FLOW", color: "bg-yellow-100 text-yellow-800 border-yellow-200", icon: <Clock className="h-3 w-3" /> },
  awaiting_admin_approval: { label: "Under Review", color: "bg-blue-100 text-blue-800 border-blue-200", icon: <Clock className="h-3 w-3" /> },
  processing: { label: "Processing", color: "bg-purple-100 text-purple-800 border-purple-200", icon: <RefreshCw className="h-3 w-3 animate-spin" /> },
  payout_pending: { label: "Sending NGN", color: "bg-purple-100 text-purple-800 border-purple-200", icon: <RefreshCw className="h-3 w-3 animate-spin" /> },
  completed: { label: "Completed", color: "bg-green-100 text-green-800 border-green-200", icon: <CheckCircle2 className="h-3 w-3" /> },
  rejected: { label: "Rejected", color: "bg-red-100 text-red-800 border-red-200", icon: <XCircle className="h-3 w-3" /> },
  failed: { label: "Failed", color: "bg-red-100 text-red-800 border-red-200", icon: <XCircle className="h-3 w-3" /> },
  payout_failed: { label: "Payout Failed", color: "bg-red-100 text-red-800 border-red-200", icon: <XCircle className="h-3 w-3" /> },
  proof_rejected: { label: "Proof Rejected", color: "bg-orange-100 text-orange-800 border-orange-200", icon: <AlertCircle className="h-3 w-3" /> },
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
            {mode === "signin" ? "Sign in to Sell FLOW" : "Create an account"}
          </CardTitle>
          <CardDescription>
            {mode === "signin"
              ? "You must be signed in to sell FLOW tokens."
              : "Create an account to start selling FLOW tokens."}
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

export default function SellPage() {
  const { user, loading } = useAuth()
  const [viewState, setViewState] = useState<ViewState>("form")
  const [requests, setRequests] = useState<Request[]>([])
  const [currentRequest, setCurrentRequest] = useState<Request | null>(null)
  const [requestCreateData, setRequestCreateData] = useState<RequestCreateData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isFetchingRequests, setIsFetchingRequests] = useState(false)

  // Form fields
  const [walletAddress, setWalletAddress] = useState("")
  const [flowAmount, setFlowAmount] = useState("")

  // Bank fields
  const [banks, setBanks] = useState<Bank[]>([])
  const [loadingBanks, setLoadingBanks] = useState(false)
  const [selectedBankCode, setSelectedBankCode] = useState("")
  const [bankAccountNumber, setBankAccountNumber] = useState("")
  const [bankAccountName, setBankAccountName] = useState("")
  const [resolvingAccount, setResolvingAccount] = useState(false)
  const [bankSearchQuery, setBankSearchQuery] = useState("")

  // Proof upload
  const [proofFile, setProofFile] = useState<File | null>(null)
  const [proofPreview, setProofPreview] = useState<string | null>(null)
  const [txHashInput, setTxHashInput] = useState("")
  const [proofNote, setProofNote] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [copiedField, setCopiedField] = useState<string | null>(null)

  const flowRate = requestCreateData?.flowNGNRate || 2000
  const estimatedNGN = flowAmount ? parseFloat((parseFloat(flowAmount) * flowRate).toFixed(2)) : 0

  const selectedBank = banks.find(b => b.code === selectedBankCode)
  const filteredBanks = bankSearchQuery
    ? banks.filter(b => b.name.toLowerCase().includes(bankSearchQuery.toLowerCase()))
    : banks

  const getAuthHeaders = useCallback(async (): Promise<HeadersInit | undefined> => {
    if (!user) return undefined
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${await user.getIdToken()}`,
    }
  }, [user])

  const loadRequests = useCallback(async () => {
    if (!user) return
    setIsFetchingRequests(true)
    try {
      const headers = await getAuthHeaders()
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/offramp/requests`, { headers })
      if (res.ok) {
        const data = await res.json()
        setRequests(data.requests || [])
      }
    } catch (e) {
      console.error("Failed to load requests:", e)
    } finally {
      setIsFetchingRequests(false)
    }
  }, [user, getAuthHeaders])

  const loadBanks = useCallback(async () => {
    if (!user || banks.length > 0) return
    setLoadingBanks(true)
    try {
      const headers = await getAuthHeaders()
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/offramp/banks`, { headers })
      if (res.ok) {
        const data = await res.json()
        setBanks(data.banks || [])
      }
    } catch (e) {
      console.error("Failed to load banks:", e)
    } finally {
      setLoadingBanks(false)
    }
  }, [user, banks.length, getAuthHeaders])

  useEffect(() => {
    if (user) {
      loadRequests()
      loadBanks()
      const saved = localStorage.getItem("flow_wallet_address")
      if (saved) setWalletAddress(saved)
    }
  }, [user, loadRequests, loadBanks])

  useEffect(() => {
    if (currentRequest && ["awaiting_admin_approval", "processing", "payout_pending"].includes(currentRequest.status)) {
      const interval = setInterval(() => pollRequest(currentRequest.id), 8000)
      return () => clearInterval(interval)
    }
  }, [currentRequest])

  // Auto-resolve account when bank and account number are complete
  useEffect(() => {
    if (selectedBankCode && bankAccountNumber.length === 10) {
      resolveAccount()
    } else {
      setBankAccountName("")
    }
  }, [selectedBankCode, bankAccountNumber])

  const resolveAccount = async () => {
    if (!selectedBankCode || bankAccountNumber.length !== 10) return
    setResolvingAccount(true)
    setBankAccountName("")
    try {
      const headers = await getAuthHeaders()
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/offramp/resolve-account`, {
        method: "POST",
        headers,
        body: JSON.stringify({ accountNumber: bankAccountNumber, bankCode: selectedBankCode }),
      })
      if (res.ok) {
        const data = await res.json()
        setBankAccountName(data.accountName || "")
        if (data.accountName) {
          toast.success(`Account verified: ${data.accountName}`)
        }
      } else {
        const err = await res.json()
        toast.error(err.error || "Could not verify account")
      }
    } catch (e) {
      console.error("Resolve account error:", e)
      toast.error("Failed to verify account. Please check details.")
    } finally {
      setResolvingAccount(false)
    }
  }

  const pollRequest = async (requestId: string) => {
    if (!user) return
    try {
      const headers = await getAuthHeaders()
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/offramp/request/${requestId}`, { headers })
      if (res.ok) {
        const data = await res.json()
        setCurrentRequest(data)
        if (data.status === "completed") {
          toast.success("NGN payout sent to your bank!", { description: `₦${data.ngnSent?.toLocaleString() || data.estimatedNGN?.toLocaleString()} sent.` })
          loadRequests()
        } else if (data.status === "rejected" || data.status === "proof_rejected") {
          toast.error("Your request was rejected.", { description: data.rejectionReason || "Contact support for details." })
          loadRequests()
        }
      }
    } catch (e) {
      console.error("Failed to poll request:", e)
    }
  }

  const handleCreateRequest = async () => {
    if (!user) { toast.error("Please sign in to continue."); return }
    if (!walletAddress || !walletAddress.startsWith("0x")) {
      toast.error("Please enter a valid Flow wallet address (starts with 0x)"); return
    }
    const amount = parseFloat(flowAmount)
    if (!flowAmount || isNaN(amount) || amount < 0.1) {
      toast.error("Minimum sell amount is 0.1 FLOW"); return
    }
    if (!selectedBankCode) {
      toast.error("Please select your bank"); return
    }
    if (bankAccountNumber.length !== 10) {
      toast.error("Please enter a valid 10-digit bank account number"); return
    }
    if (!bankAccountName) {
      toast.error("Account name not verified. Please wait for verification or check your details."); return
    }

    setIsLoading(true)
    try {
      const headers = await getAuthHeaders()
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/offramp/request`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          walletAddress,
          amount,
          payoutDetails: {
            account_number: bankAccountNumber,
            account_name: bankAccountName,
            bank_name: selectedBank?.name || "",
            bank_code: selectedBankCode,
          },
        }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Failed to create request")
      }
      const data: RequestCreateData = await res.json()
      setRequestCreateData(data)
      localStorage.setItem("flow_wallet_address", walletAddress)
      setViewState("deposit")
      await loadRequests()
    } catch (e: any) {
      toast.error(e.message || "Failed to create request. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { toast.error("File too large. Max 5MB."); return }
    setProofFile(file)
    const reader = new FileReader()
    reader.onload = () => setProofPreview(reader.result as string)
    reader.readAsDataURL(file)
  }

  const handleSubmitProof = async () => {
    const requestId = requestCreateData?.requestId || currentRequest?.id
    if (!requestId) return
    if (!proofPreview && !txHashInput) {
      toast.error("Please upload a screenshot or enter the transaction hash."); return
    }
    setIsLoading(true)
    try {
      const headers = await getAuthHeaders()
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/offramp/submit-proof/${requestId}`, {
        method: "POST",
        headers,
        body: JSON.stringify({ proofUrl: proofPreview || null, txHash: txHashInput || null, proofNote }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Failed to submit proof")
      }
      toast.success("Proof submitted! Your NGN will be sent automatically after verification.")
      const reqRes = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/offramp/request/${requestId}`, {
        headers: await getAuthHeaders(),
      })
      if (reqRes.ok) setCurrentRequest(await reqRes.json())
      setViewState("pending")
      await loadRequests()
    } catch (e: any) {
      toast.error(e.message || "Failed to submit proof.")
    } finally {
      setIsLoading(false)
    }
  }

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text)
    setCopiedField(field)
    toast.success("Copied!")
    setTimeout(() => setCopiedField(null), 2000)
  }

  const handleReset = () => {
    setCurrentRequest(null)
    setRequestCreateData(null)
    setProofFile(null)
    setProofPreview(null)
    setTxHashInput("")
    setProofNote("")
    setViewState("form")
    loadRequests()
  }

  const adminFlowAddress = requestCreateData?.adminFlowAddress || currentRequest?.adminFlowAddress

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
          <h1 className="text-4xl font-bold mb-3">Sell FLOW</h1>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Send FLOW to our wallet and receive NGN automatically in your bank account via Paystack.
          </p>
        </div>

        {/* STEP 1: Form (Amount + Bank Details) */}
        {viewState === "form" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><ArrowRightLeft className="h-5 w-5" /> Sell FLOW for NGN</CardTitle>
              <CardDescription>Enter the amount to sell and select your bank for automatic NGN payout.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label>Your Flow Wallet Address</Label>
                <div className="flex items-center gap-2">
                  <Wallet className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <Input placeholder="0x..." value={walletAddress} onChange={e => setWalletAddress(e.target.value)} />
                </div>
                <p className="text-xs text-muted-foreground">The wallet you will be sending FLOW from.</p>
              </div>

              <div className="space-y-2">
                <Label>FLOW Amount to Sell</Label>
                <Input
                  type="number"
                  placeholder="e.g. 100"
                  value={flowAmount}
                  onChange={e => setFlowAmount(e.target.value)}
                  min={0.1}
                  step={0.1}
                />
                <p className="text-xs text-muted-foreground">Minimum: 0.1 FLOW</p>
              </div>

              {flowAmount && parseFloat(flowAmount) >= 0.1 && (
                <div className="bg-muted/60 rounded-lg p-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">You Sell</span>
                    <span className="font-semibold">{parseFloat(flowAmount)} FLOW</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Rate</span>
                    <span>₦{flowRate.toLocaleString()} / FLOW</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-base font-bold">
                    <span>You Receive (est.)</span>
                    <span className="text-green-600">~₦{estimatedNGN.toLocaleString()}</span>
                  </div>
                </div>
              )}

              <Separator />

              <div>
                <h3 className="font-semibold flex items-center gap-2 mb-4"><Landmark className="h-4 w-4" /> Receiving Bank Account</h3>
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label>Bank</Label>
                    {loadingBanks ? (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
                        <Loader2 className="h-4 w-4 animate-spin" /> Loading banks...
                      </div>
                    ) : (
                      <>
                        <Input
                          placeholder="Search your bank..."
                          value={bankSearchQuery}
                          onChange={e => setBankSearchQuery(e.target.value)}
                          className="mb-2"
                        />
                        {bankSearchQuery && filteredBanks.length > 0 && !selectedBankCode && (
                          <div className="max-h-40 overflow-y-auto border rounded-lg bg-card text-card-foreground">
                            {filteredBanks.slice(0, 10).map(bank => (
                              <button
                                key={bank.code}
                                className="w-full text-left px-3 py-2 hover:bg-muted text-sm border-b last:border-0"
                                onClick={() => {
                                  setSelectedBankCode(bank.code)
                                  setBankSearchQuery(bank.name)
                                }}
                              >
                                {bank.name}
                              </button>
                            ))}
                          </div>
                        )}
                        {selectedBank && (
                          <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                            <span className="text-sm font-medium text-green-800">{selectedBank.name}</span>
                            <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={() => {
                              setSelectedBankCode("")
                              setBankSearchQuery("")
                              setBankAccountName("")
                            }}>
                              Change
                            </Button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <Label>Account Number</Label>
                    <Input
                      placeholder="0123456789"
                      value={bankAccountNumber}
                      onChange={e => setBankAccountNumber(e.target.value.replace(/\D/g, "").slice(0, 10))}
                      maxLength={10}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Account Name</Label>
                    {resolvingAccount ? (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground py-2 px-3 border rounded-lg bg-muted/30">
                        <Loader2 className="h-4 w-4 animate-spin" /> Verifying account...
                      </div>
                    ) : bankAccountName ? (
                      <div className="flex items-center gap-2 px-3 py-2 border rounded-lg bg-green-50 border-green-200">
                        <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                        <span className="font-medium text-green-800">{bankAccountName}</span>
                      </div>
                    ) : (
                      <div className="px-3 py-2 border rounded-lg bg-muted/30 text-sm text-muted-foreground">
                        {selectedBankCode && bankAccountNumber.length === 10
                          ? "Could not verify account. Check details."
                          : "Select bank and enter account number to verify"}
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800 flex items-start gap-2 mt-3">
                  <ShieldCheck className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span>NGN will be sent <strong>automatically via Paystack</strong> to this account after admin verifies your FLOW transfer.</span>
                </div>
              </div>

              <Button className="w-full" size="lg" onClick={handleCreateRequest} disabled={isLoading || !bankAccountName}>
                {isLoading ? "Creating Order..." : "Get Deposit Instructions"}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* STEP 2: Deposit Instructions */}
        {viewState === "deposit" && requestCreateData && adminFlowAddress && (
          <div className="space-y-5">
            <Card className="border-purple-200 bg-purple-50/40">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-purple-700"><Wallet className="h-5 w-5" /> Send FLOW to This Address</CardTitle>
                <CardDescription>
                  Send exactly <strong>{requestCreateData.flowAmount} FLOW</strong> from your connected wallet to the address below.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-card text-card-foreground rounded-lg p-4 border">
                  <p className="text-xs text-muted-foreground mb-1">FlowRamp Receiving Wallet</p>
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-mono text-sm font-bold break-all">{adminFlowAddress}</p>
                    <Button variant="ghost" size="sm" className="flex-shrink-0" onClick={() => copyToClipboard(adminFlowAddress, "address")}>
                      {copiedField === "address" ? <CheckCircle2 className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <div className="flex items-center justify-between py-2 border-b">
                  <div>
                    <p className="text-xs text-muted-foreground">Exact Amount to Send</p>
                    <p className="font-bold text-lg text-purple-700">{requestCreateData.flowAmount} FLOW</p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => copyToClipboard(String(requestCreateData.flowAmount), "flowAmount")}>
                    {copiedField === "flowAmount" ? <CheckCircle2 className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800">
                  Send the <strong>exact amount</strong> shown. Only send from your registered wallet address.
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="py-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                  <p className="text-sm text-muted-foreground">You will receive approximately</p>
                  <p className="text-3xl font-bold text-green-700 mt-1">~₦{requestCreateData.estimatedNGN.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    to {bankAccountName} — {selectedBank?.name || ""} ({bankAccountNumber})
                  </p>
                  <p className="text-xs text-blue-700 mt-2 flex items-center justify-center gap-1">
                    <ShieldCheck className="h-3 w-3" /> Paid automatically via Paystack
                  </p>
                </div>
              </CardContent>
            </Card>

            <Button className="w-full" size="lg" onClick={() => setViewState("proof")}>
              I've Sent the FLOW — Upload Proof
            </Button>
            <Button variant="ghost" className="w-full" onClick={handleReset}>Cancel</Button>
          </div>
        )}

        {/* STEP 3: Upload Proof */}
        {viewState === "proof" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Upload className="h-5 w-5" /> Upload Transaction Proof</CardTitle>
              <CardDescription>Upload a screenshot of your FLOW transaction or paste the transaction hash.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div
                className="border-2 border-dashed border-muted-foreground/30 rounded-xl p-8 text-center cursor-pointer hover:border-primary/50 hover:bg-muted/30 transition-all"
                onClick={() => fileInputRef.current?.click()}
              >
                {proofPreview ? (
                  <div className="space-y-3">
                    <img src={proofPreview} alt="Transaction proof" className="max-h-48 mx-auto rounded-lg object-contain border" />
                    <p className="text-sm text-muted-foreground">{proofFile?.name}</p>
                    <Button variant="outline" size="sm" onClick={e => { e.stopPropagation(); setProofFile(null); setProofPreview(null) }}>
                      Remove
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground/50" />
                    <div>
                      <p className="font-medium">Click to upload screenshot</p>
                      <p className="text-sm text-muted-foreground">PNG, JPG, JPEG up to 5MB</p>
                    </div>
                  </div>
                )}
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
              </div>

              <div className="text-center text-sm text-muted-foreground">— or —</div>

              <div className="space-y-2">
                <Label>Transaction Hash (optional)</Label>
                <Input
                  placeholder="0x..."
                  value={txHashInput}
                  onChange={e => setTxHashInput(e.target.value)}
                  className="font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground">Enter the Flow blockchain transaction ID from your wallet.</p>
              </div>

              <div className="space-y-2">
                <Label>Additional Note (optional)</Label>
                <Input
                  placeholder="Any notes for admin"
                  value={proofNote}
                  onChange={e => setProofNote(e.target.value)}
                />
              </div>

              <Button className="w-full" size="lg" onClick={handleSubmitProof} disabled={isLoading || (!proofPreview && !txHashInput)}>
                {isLoading ? "Submitting..." : "Submit Proof for Review"}
              </Button>
              <Button variant="ghost" className="w-full" onClick={() => setViewState("deposit")}>Back to Deposit Address</Button>
            </CardContent>
          </Card>
        )}

        {/* STEP 4: Pending / Status */}
        {viewState === "pending" && currentRequest && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {currentRequest.status === "completed" ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                ) : (
                  <Clock className="h-5 w-5 text-blue-600" />
                )}
                {currentRequest.status === "completed" ? "Payout Complete" : "Request In Progress"}
              </CardTitle>
              <CardDescription>
                {currentRequest.status === "completed"
                  ? "Your NGN has been sent to your bank account."
                  : "Your FLOW transfer proof has been submitted. NGN will be sent automatically after verification."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Request ID</span>
                  <span className="font-mono text-xs">{currentRequest.id.substring(0, 16)}...</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">FLOW Sent</span>
                  <span className="font-semibold">{currentRequest.amount} FLOW</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Expected NGN</span>
                  <span className="font-semibold text-green-700">~₦{currentRequest.estimatedNGN?.toLocaleString()}</span>
                </div>
                {currentRequest.payoutDetails && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Payout To</span>
                    <span className="text-right text-xs">
                      {currentRequest.payoutDetails.bank_name}<br />
                      {currentRequest.payoutDetails.account_number} — {currentRequest.payoutDetails.account_name}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-sm items-center">
                  <span className="text-muted-foreground">Status</span>
                  {(() => {
                    const cfg = statusConfig[currentRequest.status] || statusConfig.awaiting_admin_approval
                    return (
                      <span className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs border font-medium ${cfg.color}`}>
                        {cfg.icon} {cfg.label}
                      </span>
                    )
                  })()}
                </div>
              </div>

              {currentRequest.status === "completed" && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
                  <CheckCircle2 className="h-8 w-8 text-green-600 mx-auto mb-2" />
                  <p className="font-bold text-green-700 text-lg">NGN Payout Sent!</p>
                  <p className="text-sm text-muted-foreground">
                    ₦{(currentRequest.ngnSent || currentRequest.estimatedNGN)?.toLocaleString()} sent to your bank.
                  </p>
                  {currentRequest.paymentReference && (
                    <p className="text-xs font-mono mt-2 text-muted-foreground">Ref: {currentRequest.paymentReference}</p>
                  )}
                </div>
              )}

              {currentRequest.status === "payout_failed" && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
                  <XCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
                  <p className="font-bold text-red-700">Payout Failed</p>
                  <p className="text-sm text-muted-foreground mt-1">There was an issue sending NGN to your bank. Our team has been notified and will resolve this.</p>
                </div>
              )}

              {(currentRequest.status === "rejected" || currentRequest.status === "proof_rejected") && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                  <XCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
                  <p className="font-bold text-red-700 text-center">Request Rejected</p>
                  {currentRequest.rejectionReason && (
                    <p className="text-sm text-center text-muted-foreground mt-1">{currentRequest.rejectionReason}</p>
                  )}
                </div>
              )}

              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => pollRequest(currentRequest.id)}>
                  <RefreshCw className="h-4 w-4 mr-2" /> Refresh Status
                </Button>
                <Button variant="outline" className="flex-1" onClick={handleReset}>New Request</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Sell History */}
        {requests.length > 0 && (
          <div className="mt-10 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">Sell History</h2>
              <Button variant="ghost" size="sm" onClick={loadRequests} disabled={isFetchingRequests}>
                <RefreshCw className={`h-4 w-4 mr-1 ${isFetchingRequests ? "animate-spin" : ""}`} /> Refresh
              </Button>
            </div>
            <div className="space-y-3">
              {requests.map(request => {
                const cfg = statusConfig[request.status] || { label: request.status, color: "bg-gray-100 text-gray-800 border-gray-200", icon: null }
                return (
                  <Card
                    key={request.id}
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => { setCurrentRequest(request); setViewState("pending") }}
                  >
                    <CardContent className="py-4 flex items-center justify-between">
                      <div>
                        <p className="font-semibold">{request.amount} FLOW → ~₦{request.estimatedNGN?.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{new Date(request.createdAt).toLocaleString()}</p>
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
