"use client"

import { useState, useEffect } from "react"
import { SellForm } from "@/components/off-ramp/sell-form"
import { DepositInstructions } from "@/components/off-ramp/deposit-instructions"
import { WithdrawalStatus } from "@/components/off-ramp/withdrawal-status"
import { WithdrawalHistory } from "@/components/off-ramp/withdrawal-history"
import { useAuth } from "@/lib/firebase/auth" // Assuming you have a useAuth hook
import * as fcl from "@onflow/fcl";
import * as t from "@onflow/types";

// Define the type for an off-ramp request
interface OffRampRequest {
  id: string;
  status: "pending" | "funded" | "processing" | "completed" | "failed";
  deposit_address: string;
  memo: string;
  amount: number;
  stablecoin: string;
  payoutDetails: any;
  // Add other fields as necessary
}

type ViewState = "form" | "deposit" | "status"

export default function SellPage() {
  const { user } = useAuth(); // Get the authenticated user
  const [viewState, setViewState] = useState<ViewState>("form")
  const [currentRequest, setCurrentRequest] = useState<OffRampRequest | null>(null)
  const [requests, setRequests] = useState<OffRampRequest[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [jwt, setJwt] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      user.getIdToken().then(setJwt);
      loadRequests();
    }
  }, [user]);

  // Poll for request updates when processing
  useEffect(() => {
    if (
      currentRequest &&
      (currentRequest.status === "pending" ||
        currentRequest.status === "funded" ||
        currentRequest.status === "processing")
    ) {
      const interval = setInterval(() => {
        pollRequestStatus(currentRequest.id)
      }, 5000)

      return () => clearInterval(interval)
    }
  }, [currentRequest])

  const getAuthHeaders = () => {
    if (!jwt) return {};
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${jwt}`,
    };
  };

  const loadRequests = async () => {
    if (!jwt) return;
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/offramp/requests`, {
        headers: getAuthHeaders(),
      });
      if (response.ok) {
        const data = await response.json()
        setRequests(data.requests || [])
      }
    } catch (error) {
      console.error("[v0] Failed to load requests:", error)
    }
  }

  const pollRequestStatus = async (requestId: string) => {
    if (!jwt) return;
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/offramp/request/${requestId}`, {
        headers: getAuthHeaders(),
      });
      if (response.ok) {
        const data = await response.json()
        setCurrentRequest(data)

        // Reload history when completed
        if (data.status === "completed" || data.status === "failed") {
          loadRequests()
        }
      }
    } catch (error) {
      console.error("[v0] Failed to poll request:", error)
    }
  }

  const handleSubmit = async (formData: {
    walletAddress: string
    amount: number
    stablecoin: string
    payoutMethod: "bank_transfer" | "mobile_money"
    payoutDetails: any
  }) => {
    if (!jwt) {
      alert("Please sign in to continue.");
      return;
    }
    setIsLoading(true)

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/offramp/request`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        throw new Error("Failed to create request")
      }

      const data = await response.json()

      // Fetch the created request
      const requestResponse = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/offramp/request/${data.requestId}`, {
        headers: getAuthHeaders(),
      });
      if (requestResponse.ok) {
        const requestData = await requestResponse.json()
        setCurrentRequest(requestData)
        setViewState("deposit")
      }
    } catch (error) {
      console.error("[v0] Failed to create request:", error)
      alert("Failed to create withdrawal request. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleReset = () => {
    setCurrentRequest(null)
    setViewState("form")
    loadRequests()
  }

  const handleViewStatus = () => {
    setViewState("status")
  }

  const handleInitiateTransaction = async () => {
    if (!currentRequest || !jwt) {
      alert("Cannot initiate transaction. Request details are missing.");
      return;
    }
    setIsLoading(true);
    try {
      // 1. Get transaction details from the backend
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/offramp/initiate`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ requestId: currentRequest.id }),
      });

      if (!response.ok) {
        throw new Error("Failed to get transaction details from server.");
      }

      const { cadence, args } = await response.json();

      // 2. Use FCL to send the transaction for user to sign
      const txId = await fcl.mutate({
        cadence,
        args: (arg, t) => args.map((a: any) => arg(a.value, t[a.type])),
        limit: 9999,
      });

      console.log("Transaction sent with ID:", txId);
      setCurrentRequest(prev => prev ? { ...prev, txHash: txId, status: "processing" } : null);
      setViewState("status"); // Move to status view to monitor transaction

      // 3. Wait for the transaction to be sealed
      await fcl.tx(txId).onceSealed();
      pollRequestStatus(currentRequest.id); // Re-poll to get final status from backend

    } catch (error) {
      console.error("Failed to initiate transaction:", error);
      alert("Failed to send transaction. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4 text-balance">Sell Flow Stablecoins</h1>
          <p className="text-lg text-muted-foreground text-balance max-w-2xl mx-auto">
            Convert your Flow stablecoins to Nigerian Naira and receive payment directly to your account
          </p>
        </div>

        {/* Main Content */}
        <div className="flex flex-col items-center gap-8">
          {viewState === "form" && <SellForm onSubmit={handleSubmit} isLoading={isLoading} />}

          {viewState === "deposit" && currentRequest && (
            <DepositInstructions
              requestId={currentRequest.id}
              depositAddress={currentRequest.deposit_address}
              memo={currentRequest.memo}
              amount={currentRequest.amount}
              stablecoin={currentRequest.stablecoin}
              onConfirm={handleInitiateTransaction} // New prop
              isLoading={isLoading} // New prop
              onCancel={handleReset}
            />
          )}

          {viewState === "status" && currentRequest && (
            <WithdrawalStatus
              status={currentRequest.status}
              requestId={currentRequest.id}
              amount={currentRequest.amount}
              stablecoin={currentRequest.stablecoin}
              depositAddress={currentRequest.deposit_address}
              memo={currentRequest.memo}
              payoutDetails={currentRequest.payoutDetails}
              onReset={handleReset}
            />
          )}

          {/* Show deposit instructions button when in status view */}
          {viewState === "status" && currentRequest?.status === "pending" && (
            <button onClick={() => setViewState("deposit")} className="text-sm text-primary hover:underline">
              View Deposit Instructions
            </button>
          )}

          {/* Withdrawal History */}
          {requests.length > 0 && viewState === "form" && (
            <div className="w-full max-w-2xl">
              <WithdrawalHistory requests={requests} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
