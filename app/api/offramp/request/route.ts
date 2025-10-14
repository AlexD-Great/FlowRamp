import { type NextRequest, NextResponse } from "next/server"
import { offRampRequestDb } from "@/lib/db/mock-db"
import { SERVICE_WALLET } from "@/lib/constants"
import type { CreateOffRampRequest } from "@/lib/types/database"

export async function POST(request: NextRequest) {
  try {
    const body: CreateOffRampRequest = await request.json()

    const { walletAddress, amount, stablecoin, payoutMethod, payoutDetails } = body

    // Validate input
    if (!walletAddress || !amount || !stablecoin || !payoutMethod || !payoutDetails) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Generate unique memo for deposit identification
    const memo = `OFF-RAMP-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`

    // Create off-ramp request
    const offRampRequest = await offRampRequestDb.create({
      walletAddress,
      amount,
      stablecoin,
      deposit_address: SERVICE_WALLET.ADDRESS,
      memo,
      status: "pending",
      payoutDetails,
    })

    // Start deposit watcher (in production, this would be a separate service)
    startDepositWatcher(offRampRequest.id, SERVICE_WALLET.ADDRESS, memo)

    return NextResponse.json({
      requestId: offRampRequest.id,
      depositAddress: SERVICE_WALLET.ADDRESS,
      memo,
    })
  } catch (error) {
    console.error("[v0] Create off-ramp request error:", error)
    return NextResponse.json({ error: "Failed to create request" }, { status: 500 })
  }
}

// Simulate deposit watcher (in production, this would be a separate blockchain monitoring service)
function startDepositWatcher(requestId: string, depositAddress: string, memo: string) {
  console.log("[v0] Starting deposit watcher for:", requestId, memo)

  // Simulate deposit detection after 10-20 seconds
  const delay = 10000 + Math.random() * 10000

  setTimeout(async () => {
    try {
      const request = await offRampRequestDb.findById(requestId)
      if (!request || request.status !== "pending") return

      console.log("[v0] Deposit detected for:", requestId)

      // Update to funded
      await offRampRequestDb.updateStatus(requestId, "funded")

      // Process payout
      await processOffRampPayout(requestId)
    } catch (error) {
      console.error("[v0] Deposit watcher error:", error)
    }
  }, delay)
}

async function processOffRampPayout(requestId: string) {
  try {
    const request = await offRampRequestDb.findById(requestId)
    if (!request) return

    // Update to processing
    await offRampRequestDb.updateStatus(requestId, "processing")

    // Execute Forte Action to burn/escrow tokens
    const { ForteActionsService } = await import("@/lib/services/forte-actions")
    const forteService = new ForteActionsService(SERVICE_WALLET.ADDRESS)

    const actionResult = await forteService.executeOffRampAction({
      depositor: request.walletAddress,
      amount: request.amount,
      stablecoin: request.stablecoin,
      memo: request.memo,
      requestId: request.id,
    })

    if (actionResult.success) {
      // Initiate fiat payout
      const { PaymentProvider } = await import("@/lib/services/payment-provider")
      const paymentProvider = new PaymentProvider("paystack")

      const { calculateOffRampTotal } = await import("@/lib/utils/conversions")
      const calculation = calculateOffRampTotal(request.amount, "NGN")

      const payoutResult = await paymentProvider.initiatePayout(calculation.fiatAmount, "NGN", request.payoutDetails!)

      if (payoutResult.success) {
        await offRampRequestDb.updateStatus(requestId, "completed", {
          paymentProviderRef: payoutResult.providerRef,
          payoutReceiptCID: actionResult.receiptCID,
        })

        console.log("[v0] Off-Ramp completed:", requestId)
      } else {
        await offRampRequestDb.updateStatus(requestId, "failed")
      }
    } else {
      await offRampRequestDb.updateStatus(requestId, "failed")
    }
  } catch (error) {
    console.error("[v0] Process payout error:", error)
    await offRampRequestDb.updateStatus(requestId, "failed")
  }
}
