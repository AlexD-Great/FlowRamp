// Currency conversion utilities

import { EXCHANGE_RATES, FEES } from "@/lib/constants"

export function convertNGNtoUSD(ngnAmount: number): number {
  return ngnAmount * EXCHANGE_RATES.NGN_TO_USD
}

export function convertUSDtoNGN(usdAmount: number): number {
  return usdAmount * EXCHANGE_RATES.USD_TO_NGN
}

export function calculateOnRampFee(usdAmount: number): number {
  const fee = usdAmount * FEES.ON_RAMP_PERCENTAGE
  return Math.max(fee, FEES.MIN_FEE_USD)
}

export function calculateOffRampFee(usdAmount: number): number {
  const fee = usdAmount * FEES.OFF_RAMP_PERCENTAGE
  return Math.max(fee, FEES.MIN_FEE_USD)
}

export function calculateOnRampTotal(
  fiatAmount: number,
  fiatCurrency: string,
): {
  fiatAmount: number
  usdAmount: number
  fee: number
  finalAmount: number
} {
  const usdAmount = fiatCurrency === "NGN" ? convertNGNtoUSD(fiatAmount) : fiatAmount
  const fee = calculateOnRampFee(usdAmount)
  const finalAmount = usdAmount - fee

  return {
    fiatAmount,
    usdAmount,
    fee,
    finalAmount,
  }
}

export function calculateOffRampTotal(
  usdAmount: number,
  targetCurrency: string,
): {
  usdAmount: number
  fee: number
  finalUsdAmount: number
  fiatAmount: number
} {
  const fee = calculateOffRampFee(usdAmount)
  const finalUsdAmount = usdAmount - fee
  const fiatAmount = targetCurrency === "NGN" ? convertUSDtoNGN(finalUsdAmount) : finalUsdAmount

  return {
    usdAmount,
    fee,
    finalUsdAmount,
    fiatAmount,
  }
}

export function formatCurrency(amount: number, currency: string): string {
  if (currency === "NGN") {
    return `₦${amount.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }
  return `$${amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}
