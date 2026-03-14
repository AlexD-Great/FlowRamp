"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/firebase/auth"
import AdminGuard from "@/components/admin/admin-guard"
import RateManager from "@/components/admin/rate-manager"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"
import {
  CheckCircle2, XCircle, Clock, RefreshCw, Eye, EyeOff,
  Wallet, Landmark, ChevronDown, ChevronUp, User, AlertCircle
} from "lucide-react"

interface OnRampSession {
  id: string
  userId: string
  userEmail?: string
  walletAddress: string
  fiatAmount: number
  estimatedFLOW: number
  flowNGNRate?: number
  status: string
  proofUrl?: string
  proofNote?: string
  proofSubmittedAt?: string
  txHash?: string
  flowSent?: number
  rejectionReason?: string
  createdAt: string
}

interface OffRampRequest {
  id: string
  userId: string
  walletAddress: string
  amount: number
  estimatedNGN: number
  flowNGNRate?: number
  adminFlowAddress?: string
  payoutDetails?: {
    account_number: string
    account_name: string
    bank_name: string
    bank_code?: string
  }
  status: string
  proofUrl?: string
  txHash?: string
  proofNote?: string
  proofSubmittedAt?: string
  ngnSent?: number
  paymentReference?: string
  rejectionReason?: string
  createdAt: string
}

interface Stats {
  pendingOnrampCount: number
  pendingOfframpCount: number
  todayCompletedOnramp: number
  todayCompletedOfframp: number
  walletBalance: string
  totalCompletedOnramp: number
  totalCompletedOfframp: number
}

function ProofViewer({ proofUrl }: { proofUrl: string }) {
  const [expanded, setExpanded] = useState(false)
  if (!proofUrl) return <p className="text-xs text-muted-foreground italic">No proof uploaded</p>
  return (
    <div className="space-y-2">
      <Button variant="outline" size="sm" onClick={() => setExpanded(!expanded)} className="text-xs">
        {expanded ? <><EyeOff className="h-3 w-3 mr-1" /> Hide Proof</> : <><Eye className="h-3 w-3 mr-1" /> View Proof</>}
      </Button>
      {expanded && (
        <div className="border rounded-lg overflow-hidden">
          <img src={proofUrl} alt="Payment proof" className="max-h-64 w-full object-contain bg-muted" />
        </div>
      )}
    </div>
  )
}

function OnRampCard({
  session,
  onApprove,
  onReject,
}: {
  session: OnRampSession
  onApprove: (id: string, txHash: string, flowSent: string, note: string, autoTransfer: boolean) => Promise<void>
  onReject: (id: string, reason: string) => Promise<void>
}) {
  const [expanded, setExpanded] = useState(false)
  const [txHash, setTxHash] = useState("")
  const [flowSent, setFlowSent] = useState(String(session.estimatedFLOW))
  const [adminNote, setAdminNote] = useState("")
  const [rejectReason, setRejectReason] = useState("")
  const [showReject, setShowReject] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [autoTransfer, setAutoTransfer] = useState(true)

  const handleApprove = async () => {
    if (!autoTransfer && !txHash.trim()) { toast.error("Enter the FLOW transaction hash"); return }
    setIsSubmitting(true)
    await onApprove(session.id, autoTransfer ? "" : txHash, flowSent, adminNote, autoTransfer)
    setIsSubmitting(false)
  }

  const handleReject = async () => {
    if (!rejectReason.trim()) { toast.error("Enter a rejection reason"); return }
    setIsSubmitting(true)
    await onReject(session.id, rejectReason)
    setIsSubmitting(false)
  }

  return (
    <Card className="border-l-4 border-l-blue-400">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              {session.userEmail || session.userId.substring(0, 12)}...
            </CardTitle>
            <CardDescription className="mt-1">
              ₦{session.fiatAmount?.toLocaleString()} → ~{session.estimatedFLOW} FLOW
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs bg-blue-100 text-blue-800 border border-blue-200 px-2 py-0.5 rounded-full flex items-center gap-1">
              <Clock className="h-3 w-3" /> Under Review
            </span>
            <Button variant="ghost" size="sm" onClick={() => setExpanded(!expanded)}>
              {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </CardHeader>

      {expanded && (
        <CardContent className="space-y-4 pt-0">
          {/* Session details */}
          <div className="grid grid-cols-2 gap-3 text-sm bg-muted/40 rounded-lg p-3">
            <div>
              <p className="text-xs text-muted-foreground">Wallet Address</p>
              <p className="font-mono text-xs break-all">{session.walletAddress}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Submitted</p>
              <p className="text-xs">{session.proofSubmittedAt ? new Date(session.proofSubmittedAt).toLocaleString() : new Date(session.createdAt).toLocaleString()}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">NGN Paid</p>
              <p className="font-semibold">₦{session.fiatAmount?.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Expected FLOW</p>
              <p className="font-semibold text-green-700">{session.estimatedFLOW} FLOW</p>
            </div>
          </div>

          {/* User note */}
          {session.proofNote && (
            <div className="bg-yellow-50 border border-yellow-200 rounded p-2 text-xs text-yellow-800">
              <strong>User note:</strong> {session.proofNote}
            </div>
          )}

          {/* Proof image */}
          {session.proofUrl && <ProofViewer proofUrl={session.proofUrl} />}
          {!session.proofUrl && (
            <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded p-2">
              <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
              No payment proof uploaded yet.
            </div>
          )}

          {/* Approve form */}
          {!showReject && (
            <div className="space-y-3 border rounded-lg p-4 bg-green-50/50">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-green-800">✅ Approve — Send FLOW</p>
                <label className="flex items-center gap-2 cursor-pointer">
                  <span className="text-xs text-muted-foreground">Auto-transfer</span>
                  <div
                    className={`relative w-10 h-5 rounded-full transition-colors ${autoTransfer ? "bg-green-500" : "bg-gray-300"}`}
                    onClick={() => setAutoTransfer(!autoTransfer)}
                  >
                    <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${autoTransfer ? "translate-x-5" : "translate-x-0.5"}`} />
                  </div>
                </label>
              </div>

              {autoTransfer ? (
                <div className="bg-green-100 border border-green-300 rounded p-3 text-xs text-green-800">
                  🤖 <strong>Auto mode:</strong> Clicking approve will automatically send {flowSent} FLOW to <code className="font-mono">{session.walletAddress.substring(0, 12)}...</code> using the service wallet. The tx hash will be recorded automatically.
                </div>
              ) : (
                <div className="space-y-1.5">
                  <Label className="text-xs">FLOW Transaction Hash <span className="text-red-500">*</span></Label>
                  <Input
                    placeholder="Flow blockchain tx ID (e.g. abc123...)"
                    value={txHash}
                    onChange={e => setTxHash(e.target.value)}
                    className="font-mono text-xs"
                  />
                  <p className="text-xs text-muted-foreground">Enter the tx hash after manually sending FLOW to the user's wallet.</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">FLOW to Send</Label>
                  <Input
                    type="number"
                    value={flowSent}
                    onChange={e => setFlowSent(e.target.value)}
                    step={0.0001}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Admin Note (optional)</Label>
                  <Input placeholder="Internal note" value={adminNote} onChange={e => setAdminNote(e.target.value)} />
                </div>
              </div>
              <div className="flex gap-2">
                <Button className="flex-1 bg-green-600 hover:bg-green-700" onClick={handleApprove} disabled={isSubmitting}>
                  <CheckCircle2 className="h-4 w-4 mr-1" />
                  {isSubmitting ? (autoTransfer ? "Sending FLOW..." : "Processing...") : (autoTransfer ? "Send FLOW & Complete" : "Mark as Completed")}
                </Button>
                <Button variant="outline" className="text-red-600 border-red-300" onClick={() => setShowReject(true)}>
                  Reject
                </Button>
              </div>
            </div>
          )}

          {/* Reject form */}
          {showReject && (
            <div className="space-y-3 border border-red-200 rounded-lg p-4 bg-red-50/50">
              <p className="text-sm font-semibold text-red-800">❌ Reject Request</p>
              <div className="space-y-1.5">
                <Label className="text-xs">Rejection Reason <span className="text-red-500">*</span></Label>
                <Input
                  placeholder="e.g. Payment amount incorrect, proof unclear..."
                  value={rejectReason}
                  onChange={e => setRejectReason(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <Button variant="destructive" className="flex-1" onClick={handleReject} disabled={isSubmitting}>
                  <XCircle className="h-4 w-4 mr-1" />
                  {isSubmitting ? "Rejecting..." : "Confirm Rejection"}
                </Button>
                <Button variant="outline" onClick={() => setShowReject(false)}>Cancel</Button>
              </div>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  )
}

function OffRampCard({
  request,
  onApprove,
  onReject,
}: {
  request: OffRampRequest
  onApprove: (id: string, ngnSent: string, paymentRef: string, note: string) => Promise<void>
  onReject: (id: string, reason: string) => Promise<void>
}) {
  const [expanded, setExpanded] = useState(false)
  const [ngnSent, setNgnSent] = useState(String(request.estimatedNGN))
  const [paymentRef, setPaymentRef] = useState("")
  const [adminNote, setAdminNote] = useState("")
  const [rejectReason, setRejectReason] = useState("")
  const [showReject, setShowReject] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleApprove = async () => {
    if (!paymentRef.trim() && !ngnSent.trim()) { toast.error("Enter the payment reference or NGN sent amount"); return }
    setIsSubmitting(true)
    await onApprove(request.id, ngnSent, paymentRef, adminNote)
    setIsSubmitting(false)
  }

  const handleReject = async () => {
    if (!rejectReason.trim()) { toast.error("Enter a rejection reason"); return }
    setIsSubmitting(true)
    await onReject(request.id, rejectReason)
    setIsSubmitting(false)
  }

  return (
    <Card className="border-l-4 border-l-purple-400">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              {request.walletAddress.substring(0, 10)}...
            </CardTitle>
            <CardDescription className="mt-1">
              {request.amount} FLOW → ~₦{request.estimatedNGN?.toLocaleString()}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs bg-purple-100 text-purple-800 border border-purple-200 px-2 py-0.5 rounded-full flex items-center gap-1">
              <Clock className="h-3 w-3" /> Under Review
            </span>
            <Button variant="ghost" size="sm" onClick={() => setExpanded(!expanded)}>
              {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </CardHeader>

      {expanded && (
        <CardContent className="space-y-4 pt-0">
          {/* Request details */}
          <div className="grid grid-cols-2 gap-3 text-sm bg-muted/40 rounded-lg p-3">
            <div>
              <p className="text-xs text-muted-foreground">From Wallet</p>
              <p className="font-mono text-xs break-all">{request.walletAddress}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">FLOW Amount</p>
              <p className="font-semibold">{request.amount} FLOW</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Expected NGN</p>
              <p className="font-semibold text-green-700">₦{request.estimatedNGN?.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Submitted</p>
              <p className="text-xs">{request.proofSubmittedAt ? new Date(request.proofSubmittedAt).toLocaleString() : new Date(request.createdAt).toLocaleString()}</p>
            </div>
          </div>

          {/* Bank payout details */}
          {request.payoutDetails && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 space-y-1">
              <p className="text-xs font-semibold text-blue-800 flex items-center gap-1"><Landmark className="h-3.5 w-3.5" /> Send NGN to this account:</p>
              <p className="text-sm font-bold">{request.payoutDetails.bank_name}</p>
              <p className="text-sm">{request.payoutDetails.account_number} — {request.payoutDetails.account_name}</p>
            </div>
          )}

          {/* FLOW tx hash from user */}
          {request.txHash && (
            <div className="text-xs bg-muted rounded p-2">
              <p className="text-muted-foreground mb-0.5">User's FLOW Tx Hash:</p>
              <p className="font-mono break-all">{request.txHash}</p>
            </div>
          )}

          {/* User note */}
          {request.proofNote && (
            <div className="bg-yellow-50 border border-yellow-200 rounded p-2 text-xs text-yellow-800">
              <strong>User note:</strong> {request.proofNote}
            </div>
          )}

          {/* Proof image */}
          {request.proofUrl && <ProofViewer proofUrl={request.proofUrl} />}
          {!request.proofUrl && !request.txHash && (
            <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded p-2">
              <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
              No proof submitted yet.
            </div>
          )}

          {/* Approve form */}
          {!showReject && (
            <div className="space-y-3 border rounded-lg p-4 bg-green-50/50">
              <p className="text-sm font-semibold text-green-800">✅ Approve — Confirm NGN Sent</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">NGN Sent</Label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">₦</span>
                    <Input
                      type="number"
                      value={ngnSent}
                      onChange={e => setNgnSent(e.target.value)}
                      className="pl-6"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Payment Reference</Label>
                  <Input
                    placeholder="Bank transfer ref..."
                    value={paymentRef}
                    onChange={e => setPaymentRef(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Admin Note (optional)</Label>
                <Input placeholder="Internal note" value={adminNote} onChange={e => setAdminNote(e.target.value)} />
              </div>
              <div className="flex gap-2">
                <Button className="flex-1 bg-green-600 hover:bg-green-700" onClick={handleApprove} disabled={isSubmitting}>
                  <CheckCircle2 className="h-4 w-4 mr-1" />
                  {isSubmitting ? "Processing..." : "Mark as Completed"}
                </Button>
                <Button variant="outline" className="text-red-600 border-red-300" onClick={() => setShowReject(true)}>
                  Reject
                </Button>
              </div>
            </div>
          )}

          {/* Reject form */}
          {showReject && (
            <div className="space-y-3 border border-red-200 rounded-lg p-4 bg-red-50/50">
              <p className="text-sm font-semibold text-red-800">❌ Reject Request</p>
              <div className="space-y-1.5">
                <Label className="text-xs">Rejection Reason <span className="text-red-500">*</span></Label>
                <Input
                  placeholder="e.g. FLOW not received, proof unclear..."
                  value={rejectReason}
                  onChange={e => setRejectReason(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <Button variant="destructive" className="flex-1" onClick={handleReject} disabled={isSubmitting}>
                  <XCircle className="h-4 w-4 mr-1" />
                  {isSubmitting ? "Rejecting..." : "Confirm Rejection"}
                </Button>
                <Button variant="outline" onClick={() => setShowReject(false)}>Cancel</Button>
              </div>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  )
}

export default function AdminPage() {
  const { user } = useAuth()
  const [onRampSessions, setOnRampSessions] = useState<OnRampSession[]>([])
  const [offRampRequests, setOffRampRequests] = useState<OffRampRequest[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (user) loadData()
  }, [user])

  const getAuthHeaders = async (): Promise<HeadersInit | undefined> => {
    if (!user) return undefined
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${await user.getIdToken()}`,
    }
  }

  const loadData = async () => {
    if (!user) return
    setIsLoading(true)
    try {
      const headers = await getAuthHeaders()
      const [onRampRes, offRampRes, statsRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/admin/pending-onramp`, { headers }),
        fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/admin/pending-offramp`, { headers }),
        fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/admin/stats`, { headers }),
      ])
      if (onRampRes.ok) setOnRampSessions((await onRampRes.json()).sessions || [])
      if (offRampRes.ok) setOffRampRequests((await offRampRes.json()).requests || [])
      if (statsRes.ok) setStats(await statsRes.json())
    } catch (error) {
      console.error("Failed to load admin data:", error)
      toast.error("Failed to load data")
    } finally {
      setIsLoading(false)
    }
  }

  const handleApproveOnRamp = async (sessionId: string, txHash: string, flowSent: string, adminNote: string, autoTransfer: boolean = true) => {
    try {
      const headers = await getAuthHeaders()
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/admin/approve-onramp/${sessionId}`, {
        method: "POST",
        headers,
        body: JSON.stringify({ txHash: txHash || undefined, flowSent: parseFloat(flowSent), adminNote, autoTransfer }),
      })
      if (res.ok) {
        toast.success("On-ramp approved and marked as completed")
        await loadData()
      } else {
        const err = await res.json()
        toast.error(err.error || "Failed to approve")
      }
    } catch {
      toast.error("Failed to approve on-ramp")
    }
  }

  const handleApproveOffRamp = async (requestId: string, ngnSent: string, paymentRef: string, adminNote: string) => {
    try {
      const headers = await getAuthHeaders()
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/admin/approve-offramp/${requestId}`, {
        method: "POST",
        headers,
        body: JSON.stringify({ ngnSent: parseFloat(ngnSent), paymentReference: paymentRef, adminNote }),
      })
      if (res.ok) {
        toast.success("Off-ramp approved and marked as completed")
        await loadData()
      } else {
        const err = await res.json()
        toast.error(err.error || "Failed to approve")
      }
    } catch {
      toast.error("Failed to approve off-ramp")
    }
  }

  const handleRejectOnRamp = async (sessionId: string, reason: string) => {
    try {
      const headers = await getAuthHeaders()
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/admin/reject-onramp/${sessionId}`, {
        method: "POST",
        headers,
        body: JSON.stringify({ reason }),
      })
      if (res.ok) {
        toast.success("On-ramp request rejected")
        await loadData()
      } else {
        const err = await res.json()
        toast.error(err.error || "Failed to reject")
      }
    } catch {
      toast.error("Failed to reject on-ramp")
    }
  }

  const handleRejectOffRamp = async (requestId: string, reason: string) => {
    try {
      const headers = await getAuthHeaders()
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/admin/reject-offramp/${requestId}`, {
        method: "POST",
        headers,
        body: JSON.stringify({ reason }),
      })
      if (res.ok) {
        toast.success("Off-ramp request rejected")
        await loadData()
      } else {
        const err = await res.json()
        toast.error(err.error || "Failed to reject")
      }
    } catch {
      toast.error("Failed to reject off-ramp")
    }
  }

  return (
    <AdminGuard>
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
        <div className="container mx-auto px-4 py-12">
          <div className="text-center mb-10">
            <h1 className="text-4xl font-bold mb-3">Admin Dashboard</h1>
            <p className="text-muted-foreground">Review payment proofs and manually process FLOW deposits and NGN payouts.</p>
          </div>

          <div className="space-y-8 max-w-4xl mx-auto">
            {/* Rate Manager */}
            <RateManager />

            {/* Stats */}
            {stats && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: "Pending On-Ramp", value: stats.pendingOnrampCount, color: "text-blue-600" },
                  { label: "Pending Off-Ramp", value: stats.pendingOfframpCount, color: "text-purple-600" },
                  { label: "Completed Today", value: stats.todayCompletedOnramp + stats.todayCompletedOfframp, color: "text-green-600" },
                  { label: "Wallet Balance", value: `${parseFloat(stats.walletBalance || "0").toFixed(2)} FLOW`, color: "text-orange-600" },
                ].map(({ label, value, color }) => (
                  <Card key={label}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-xs text-muted-foreground">{label}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className={`text-2xl font-bold ${color}`}>{value}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Pending Review Tabs */}
            <Tabs defaultValue="onramp">
              <div className="flex items-center justify-between mb-4">
                <TabsList>
                  <TabsTrigger value="onramp" className="gap-2">
                    Buy Requests
                    {onRampSessions.length > 0 && (
                      <span className="bg-blue-500 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[20px] text-center">
                        {onRampSessions.length}
                      </span>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="offramp" className="gap-2">
                    Sell Requests
                    {offRampRequests.length > 0 && (
                      <span className="bg-purple-500 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[20px] text-center">
                        {offRampRequests.length}
                      </span>
                    )}
                  </TabsTrigger>
                </TabsList>
                <Button variant="outline" size="sm" onClick={loadData} disabled={isLoading}>
                  <RefreshCw className={`h-4 w-4 mr-1.5 ${isLoading ? "animate-spin" : ""}`} />
                  Refresh
                </Button>
              </div>

              {/* On-Ramp (Buy) Requests */}
              <TabsContent value="onramp" className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
                  <strong>Workflow:</strong> User paid NGN to your bank → uploaded proof → awaiting your review.<br />
                  After verifying, manually send FLOW to their wallet, then approve with the transaction hash.
                </div>
                {isLoading ? (
                  <div className="space-y-3">
                    {[1, 2].map(i => <div key={i} className="h-20 bg-muted animate-pulse rounded-lg" />)}
                  </div>
                ) : onRampSessions.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <CheckCircle2 className="h-10 w-10 mx-auto mb-3 text-green-500 opacity-50" />
                    <p>No pending buy requests</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {onRampSessions.map(session => (
                      <OnRampCard
                        key={session.id}
                        session={session}
                        onApprove={handleApproveOnRamp}
                        onReject={handleRejectOnRamp}
                      />
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* Off-Ramp (Sell) Requests */}
              <TabsContent value="offramp" className="space-y-4">
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 text-sm text-purple-800">
                  <strong>Workflow:</strong> User sent FLOW to your wallet → uploaded proof → awaiting your review.<br />
                  After verifying the FLOW was received, send NGN to their bank account, then approve with payment reference.
                </div>
                {isLoading ? (
                  <div className="space-y-3">
                    {[1, 2].map(i => <div key={i} className="h-20 bg-muted animate-pulse rounded-lg" />)}
                  </div>
                ) : offRampRequests.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <CheckCircle2 className="h-10 w-10 mx-auto mb-3 text-green-500 opacity-50" />
                    <p>No pending sell requests</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {offRampRequests.map(request => (
                      <OffRampCard
                        key={request.id}
                        request={request}
                        onApprove={handleApproveOffRamp}
                        onReject={handleRejectOffRamp}
                      />
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </AdminGuard>
  )
}
