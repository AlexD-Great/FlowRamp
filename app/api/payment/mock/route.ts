// Mock payment page for demo purposes
// In production, users would be redirected to actual payment provider

import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const ref = searchParams.get("ref")
  const amount = searchParams.get("amount")

  // In a real implementation, this would redirect to Paystack/Flutterwave/Stripe
  // For demo, we'll simulate a successful payment by calling our webhook

  if (ref) {
    // Simulate payment success after 2 seconds
    setTimeout(async () => {
      try {
        await fetch(`${request.nextUrl.origin}/api/payment/webhook`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            paymentRef: ref,
            status: "success",
            amount: Number.parseFloat(amount || "0"),
            providerRef: `mock_${Date.now()}`,
          }),
        })
      } catch (error) {
        console.error("[v0] Mock payment webhook call failed:", error)
      }
    }, 2000)
  }

  return NextResponse.json({
    message: "Mock payment - in production, redirect to payment provider",
    ref,
    amount,
  })
}
