import { type NextRequest, NextResponse } from "next/server"
import { onRampSessionDb } from "@/lib/db/mock-db"
import { PaymentProvider } from "@/lib/services/payment-provider"
import { ForteActionsService } from "@/lib/services/forte-actions"
import { SERVICE_WALLET } from "@/lib/constants"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const signature = request.headers.get("x-paystack-signature") || ""

    // Verify webhook signature
    const paymentProvider = new PaymentProvider("paystack")
    const isValid = paymentProvider.verifyWebhookSignature(signature, JSON.stringify(body))

    if (!isValid) {
      console.error("[v0] Invalid webhook signature")
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
    }

    const { paymentRef, status, amount, providerRef } = body

    // Find session by payment reference
    const session = await onRampSessionDb.findByPaymentRef(paymentRef)

    if (!session) {
      console.error("[v0] Session not found for payment ref:", paymentRef)
      return NextResponse.json({ error: "Session not found" }, { status: 404 })
    }

    if (status === "success") {
      // Update session to paid
      await onRampSessionDb.updateStatus(session.id, "paid", {
        paymentProviderRef: providerRef,
      })

      // Execute Forte Action to mint/transfer stablecoins
      const forteService = new ForteActionsService(SERVICE_WALLET.ADDRESS)
      const timestamp = Date.now()
      const backendSig = forteService.generateActionSignature(session.id, timestamp)

      // Mark as processing
      await onRampSessionDb.updateStatus(session.id, "processing")

      // Execute on-chain action (async)
      const actionResult = await forteService.executeOnRampAction({
        beneficiary: session.walletAddress,
        amountUSD: session.usdAmount,
        stablecoin: session.stablecoin,
        sessionId: session.id,
        backendSig,
      })

      if (actionResult.success) {
        // Update session with transaction details
        await onRampSessionDb.updateStatus(session.id, "completed", {
          txHash: actionResult.txHash,
          receiptCID: actionResult.receiptCID,
        })

        console.log("[v0] On-Ramp completed:", session.id, actionResult.txHash)
      } else {
        // Mark as failed
        await onRampSessionDb.updateStatus(session.id, "failed")
        console.error("[v0] On-Ramp Action failed:", actionResult.error)
      }
    } else {
      // Payment failed
      await onRampSessionDb.updateStatus(session.id, "failed")
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Webhook error:", error)
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 })
  }
}
