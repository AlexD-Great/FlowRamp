"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/firebase/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { updateProfile } from "firebase/auth";
import { fetchOnRampSessions, fetchOffRampRequests, fetchWalletBalance, fetchKYCStatus } from "@/lib/api/dashboard";
import { BackButton } from "@/components/ui/back-button";

interface Transaction {
  id?: string;
  sessionId?: string;
  requestId?: string;
  type: "onramp" | "offramp";
  amount: number;
  fiatAmount?: number;
  status: string;
  stablecoin: string;
  createdAt: string;
  txHash?: string;
}

export default function Dashboard() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  
  // State
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [walletBalance, setWalletBalance] = useState({ flow: "0.00", fusdc: "0.00", fusdt: "0.00" });
  const [loading, setLoading] = useState(true);
  const [displayName, setDisplayName] = useState("");
  const [editingProfile, setEditingProfile] = useState(false);
  const [walletAddress, setWalletAddress] = useState("");
  const [loadingBalance, setLoadingBalance] = useState(false);
  const [kycStatus, setKycStatus] = useState<"not_started" | "pending" | "approved" | "rejected">("not_started");

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/signin");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || "");
      loadDashboardData();
    }
  }, [user]);

  const loadDashboardData = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Fetch on-ramp and off-ramp transactions
      const [onRampData, offRampData] = await Promise.all([
        fetchOnRampSessions(user).catch(() => ({ sessions: [] })),
        fetchOffRampRequests(user).catch(() => ({ requests: [] })),
      ]);

      // Combine and format transactions
      const onRampTransactions: Transaction[] = (onRampData.sessions || []).map((session: any) => ({
        id: session.id,
        type: "onramp" as const,
        amount: session.usdAmount || 0,
        fiatAmount: session.fiatAmount || 0,
        status: session.status || "unknown",
        stablecoin: session.stablecoin || "fUSDC",
        createdAt: session.createdAt,
        txHash: session.txHash,
      }));

      const offRampTransactions: Transaction[] = (offRampData.requests || []).map((request: any) => ({
        id: request.id,
        type: "offramp" as const,
        amount: request.amount || 0,
        status: request.status || "unknown",
        stablecoin: request.stablecoin || "fUSDC",
        createdAt: request.createdAt,
        txHash: request.txHash,
      }));

      const allTransactions = [...onRampTransactions, ...offRampTransactions]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      setTransactions(allTransactions);

      // Fetch KYC status
      const kycData = await fetchKYCStatus(user);
      setKycStatus(kycData.status || "not_started");

    } catch (error) {
      console.error("Error loading dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLoadBalance = async () => {
    if (!user || !walletAddress || !walletAddress.startsWith("0x")) {
      alert("Please enter a valid Flow address (starts with 0x)");
      return;
    }

    setLoadingBalance(true);
    try {
      const balance = await fetchWalletBalance(walletAddress, user);
      setWalletBalance(balance);
    } catch (error) {
      console.error("Error loading balance:", error);
      alert("Failed to load wallet balance");
    } finally {
      setLoadingBalance(false);
    }
  };

  const handleLogout = async () => {
    const { logout: signOutUser } = await import("@/lib/firebase/auth");
    await signOutUser();
    router.push("/");
  };

  const handleUpdateProfile = async () => {
    if (!user) return;
    
    try {
      await updateProfile(user, { displayName });
      setEditingProfile(false);
      alert("Profile updated successfully!");
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("Failed to update profile");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
        return "text-green-600 bg-green-50";
      case "pending":
        return "text-yellow-600 bg-yellow-50";
      case "failed":
        return "text-red-600 bg-red-50";
      default:
        return "text-gray-600 bg-gray-50";
    }
  };

  const getKycStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "text-green-600 bg-green-50 border-green-200";
      case "pending":
        return "text-yellow-600 bg-yellow-50 border-yellow-200";
      case "rejected":
        return "text-red-600 bg-red-50 border-red-200";
      case "not_started":
        return "text-blue-600 bg-blue-50 border-blue-200";
      default:
        return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  const getKycStatusMessage = (status: string) => {
    switch (status) {
      case "approved":
        return "Your identity has been verified";
      case "pending":
        return "Your KYC verification is being reviewed";
      case "rejected":
        return "Please contact support for assistance";
      case "not_started":
        return "Start your verification to unlock all features";
      default:
        return "Unknown status";
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-lg">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Back Button */}
      <div>
        <BackButton href="/" />
      </div>
      
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Welcome, {displayName || user.email}</h1>
          <p className="text-gray-600 mt-1">Manage your crypto on-ramp and off-ramp transactions</p>
        </div>
        <Button onClick={handleLogout} variant="outline">
          Logout
        </Button>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="wallet">Wallet</TabsTrigger>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="kyc">KYC Status</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-3">
            {/* Stats Cards */}
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Total Transactions</CardDescription>
                <CardTitle className="text-3xl">{transactions.length}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">
                  {transactions.filter(t => t.type === "onramp").length} buy · {" "}
                  {transactions.filter(t => t.type === "offramp").length} sell
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Completed</CardDescription>
                <CardTitle className="text-3xl">
                  {transactions.filter(t => t.status === "completed").length}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-green-600">Successfully processed</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Pending</CardDescription>
                <CardTitle className="text-3xl">
                  {transactions.filter(t => t.status === "pending" || t.status === "created").length}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-yellow-600">Awaiting processing</p>
              </CardContent>
            </Card>
          </div>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-3">
              {/* Stats Cards */}
              <Card>
                <CardHeader className="pb-3">
                  <CardDescription>Total Transactions</CardDescription>
                  <CardTitle className="text-3xl">{transactions.length}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">
                    {transactions.filter(t => t.type === "onramp").length} buy · {" "}
                    {transactions.filter(t => t.type === "offramp").length} sell
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardDescription>Completed</CardDescription>
                  <CardTitle className="text-3xl">
                    {transactions.filter(t => t.status === "completed").length}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-green-600">Successfully processed</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardDescription>Pending</CardDescription>
                  <CardTitle className="text-3xl">
                    {transactions.filter(t => t.status === "pending" || t.status === "created").length}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-yellow-600">Awaiting processing</p>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Navigate to key features</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3 md:grid-cols-4">
                <Button onClick={() => router.push("/buy")} className="w-full">
                  Buy Stablecoins
                </Button>
                <Button onClick={() => router.push("/sell")} className="w-full" variant="outline">
                  Sell Stablecoins
                </Button>
                <Button onClick={() => router.push("/swap")} className="w-full" variant="outline">
                  Swap Tokens
                </Button>
                <Button onClick={() => router.push("/wallet")} className="w-full" variant="outline">
                  My Wallet
                </Button>
              </CardContent>
            </Card>

            {/* Recent Transactions */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Transactions</CardTitle>
                <CardDescription>Your latest 5 transactions</CardDescription>
              </CardHeader>
              <CardContent>
                {transactions.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">No transactions yet</p>
                ) : (
                  <div className="space-y-3">
                    {transactions.slice(0, 5).map((tx, index) => (
                      <div key={tx.id || index} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium capitalize">{tx.type}</span>
                            <span className={`text-xs px-2 py-1 rounded ${getStatusColor(tx.status)}`}>
                              {tx.status}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">
                            {new Date(tx.createdAt).toLocaleDateString()} · {tx.stablecoin}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">
                            {tx.type === "onramp" ? "+" : "-"}{tx.amount.toFixed(2)} {tx.stablecoin}
                          </p>
                          {tx.fiatAmount && (
                            <p className="text-sm text-gray-600">₦{tx.fiatAmount.toFixed(2)}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Transactions Tab */}
          <TabsContent value="transactions" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Transaction History</CardTitle>
                <CardDescription>All your on-ramp and off-ramp transactions</CardDescription>
              </CardHeader>
              <CardContent>
                {transactions.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-gray-500 mb-4">No transactions yet</p>
                    <Button onClick={() => router.push("/buy")}>Make your first purchase</Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {transactions.map((tx, index) => (
                      <div key={tx.id || index} className="p-4 border rounded-lg hover:bg-gray-50">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="font-semibold capitalize">{tx.type}</span>
                              <span className={`text-xs px-2 py-1 rounded ${getStatusColor(tx.status)}`}>
                                {tx.status}
                              </span>
                            </div>
                            <div className="space-y-1 text-sm text-gray-600">
                              <p>Amount: {tx.amount.toFixed(2)} {tx.stablecoin}</p>
                              {tx.fiatAmount && <p>Fiat: ₦{tx.fiatAmount.toFixed(2)}</p>}
                              <p>Date: {new Date(tx.createdAt).toLocaleString()}</p>
                              {tx.txHash && (
                                <p className="font-mono text-xs break-all">
                                  Tx: {tx.txHash.substring(0, 20)}...
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <p className={`text-lg font-bold ${tx.type === "onramp" ? "text-green-600" : "text-red-600"}`}>
                              {tx.type === "onramp" ? "+" : "-"}{tx.amount.toFixed(2)}
                            </p>
                            <p className="text-sm text-gray-600">{tx.stablecoin}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Wallet Tab */}
          <TabsContent value="wallet" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Wallet Balance</CardTitle>
                <CardDescription>Check your Flow wallet token balances</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Wallet Address Input */}
                <div className="space-y-2">
                  <Label>Flow Wallet Address</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="0x..."
                      value={walletAddress}
                      onChange={(e) => setWalletAddress(e.target.value)}
                      disabled={loadingBalance}
                    />
                    <Button onClick={handleLoadBalance} disabled={loadingBalance}>
                      {loadingBalance ? "Loading..." : "Check Balance"}
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500">
                    Enter any Flow wallet address to check its balance
                  </p>
                </div>

                {/* Balance Display */}
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="p-4 border rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">FLOW</p>
                    <p className="text-2xl font-bold">{walletBalance.flow}</p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">fUSDC</p>
                    <p className="text-2xl font-bold">{walletBalance.fusdc}</p>
                    <p className="text-xs text-gray-500 mt-1">Coming soon</p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">fUSDT</p>
                    <p className="text-2xl font-bold">{walletBalance.fusdt}</p>
                    <p className="text-xs text-gray-500 mt-1">Coming soon</p>
                  </div>
                </div>
                
                <div className="pt-4 border-t">
                  <p className="text-sm text-gray-600 mb-4">
                    <strong>Live Data:</strong> Balance is fetched directly from Flow testnet blockchain.
                    {walletAddress && ` Showing balance for ${walletAddress.substring(0, 10)}...`}
                  </p>
                  <Button onClick={() => router.push("/wallet")} className="w-full" variant="outline">
                    Go to Wallet Page
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Profile Settings</CardTitle>
                <CardDescription>Manage your account information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input value={user.email || ""} disabled />
                  <p className="text-xs text-gray-500">Email cannot be changed</p>
                </div>

                <div className="space-y-2">
                  <Label>Display Name</Label>
                  <div className="flex gap-2">
                    <Input
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      disabled={!editingProfile}
                      placeholder="Enter your display name"
                    />
                    {editingProfile ? (
                      <div className="flex gap-2">
                        <Button onClick={handleUpdateProfile}>Save</Button>
                        <Button variant="outline" onClick={() => {
                          setEditingProfile(false);
                          setDisplayName(user.displayName || "");
                        }}>
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      <Button onClick={() => setEditingProfile(true)}>Edit</Button>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>User ID</Label>
                  <Input value={user.uid} disabled className="font-mono text-xs" />
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4">
                  <div>
                    <Label>Account Created</Label>
                    <p className="text-sm mt-1">{user.metadata.creationTime ? new Date(user.metadata.creationTime).toLocaleDateString() : "N/A"}</p>
                  </div>
                  <div>
                    <Label>Last Sign In</Label>
                    <p className="text-sm mt-1">{user.metadata.lastSignInTime ? new Date(user.metadata.lastSignInTime).toLocaleDateString() : "N/A"}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* KYC Tab */}
          <TabsContent value="kyc" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>KYC Verification</CardTitle>
                <CardDescription>Complete your identity verification</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* KYC Status Badge */}
                <div className={`p-4 rounded-lg border-2 ${getKycStatusColor(kycStatus)}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-lg capitalize">
                        Status: {kycStatus.replace("_", " ")}
                      </p>
                      <p className="text-sm mt-1">
                        {getKycStatusMessage(kycStatus)}
                      </p>
                    </div>
                    <div className="h-12 w-12 rounded-full bg-white flex items-center justify-center">
                      {kycStatus === "approved" ? (
                        <svg className="h-6 w-6 text-green-600" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                          <path d="M5 13l4 4L19 7"></path>
                        </svg>
                      ) : kycStatus === "pending" ? (
                        <svg className="h-6 w-6 text-yellow-600" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                          <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                      ) : kycStatus === "rejected" ? (
                        <svg className="h-6 w-6 text-red-600" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                          <path d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                      ) : (
                        <svg className="h-6 w-6 text-blue-600" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                          <path d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                      )}
                    </div>
                  </div>
                </div>

                {/* Email Verification */}
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Email Verification</p>
                      <p className="text-sm text-gray-600 mt-1">
                        {user.emailVerified ? "Your email is verified ✓" : "Please verify your email address"}
                      </p>
                    </div>
                    {!user.emailVerified && (
                      <Button size="sm">Send Verification Email</Button>
                    )}
                  </div>
                </div>

                {/* KYC Features */}
                <div className="space-y-4">
                  <h3 className="font-semibold">Verification Benefits</h3>
                  <ul className="space-y-2">
                    <li className="flex items-center gap-2">
                      <svg className="h-5 w-5 text-green-600" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                        <path d="M5 13l4 4L19 7"></path>
                      </svg>
                      <span>Higher transaction limits</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <svg className="h-5 w-5 text-green-600" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                        <path d="M5 13l4 4L19 7"></path>
                      </svg>
                      <span>Faster transaction processing</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <svg className="h-5 w-5 text-green-600" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                        <path d="M5 13l4 4L19 7"></path>
                      </svg>
                      <span>Access to premium features</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <svg className="h-5 w-5 text-green-600" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                        <path d="M5 13l4 4L19 7"></path>
                      </svg>
                      <span>Enhanced account security</span>
                    </li>
                  </ul>
                </div>

                {kycStatus === "pending" && (
                  <div className="pt-4 border-t">
                    <p className="text-sm text-gray-600 mb-4">
                      <strong>What's next?</strong> Our team is reviewing your documents. 
                      This usually takes 1-2 business days. We'll email you once approved.
                    </p>
                  </div>
                )}

                {kycStatus !== "approved" && (
                  <Button className="w-full" disabled={kycStatus === "pending"}>
                    {kycStatus === "pending" ? "Verification Pending..." : "Start KYC Verification"}
                  </Button>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
