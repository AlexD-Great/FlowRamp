import { type NextRequest, NextResponse } from "next/server"
import { onRampSessionDb } from "@/lib/db/mock-db"
import { PaymentProvider } from "@/lib/services/payment-provider"
import { calculateOnRampTotal } from "@/lib/utils/conversions"
import type { CreateOnRampSessionRequest } from "@/lib/types/database"

export async function POST(request: NextRequest) {
  try {
    const body: CreateOnRampSessionRequest = await request.json()

    const { walletAddress, fiatCurrency, fiatAmount, preferredStablecoin = "fUSDC" } = body

    // Validate input
    if (!walletAddress || !fiatCurrency || !fiatAmount) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Calculate amounts
    const calculation = calculateOnRampTotal(fiatAmount, fiatCurrency)

    // Create payment intent with provider
    const paymentProvider = new PaymentProvider("paystack")
    const paymentIntent = await paymentProvider.createPaymentIntent(fiatAmount, fiatCurrency, {
      walletAddress,
      stablecoin: preferredStablecoin,
    })

    // Create session in database
    const session = await onRampSessionDb.create({
      walletAddress,
      fiatAmount,
      fiatCurrency,
      usdAmount: calculation.finalAmount,
      stablecoin: preferredStablecoin,
      paymentRef: paymentIntent.paymentRef,
      paymentProviderRef: paymentIntent.providerRef,
      status: "created",
    })

    return NextResponse.json({
      sessionId: session.id,
      paymentUrl: paymentIntent.paymentUrl,
      paymentRef: paymentIntent.paymentRef,
      expiresAt: paymentIntent.expiresAt.toISOString(),
    })
  } catch (error) {
    console.error("[v0] Create session error:", error)
    return NextResponse.json({ error: "Failed to create session" }, { status: 500 })
  }
}
