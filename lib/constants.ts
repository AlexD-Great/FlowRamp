// Application constants

export const SUPPORTED_CURRENCIES = {
  NGN: {
    name: "Nigerian Naira",
    symbol: "₦",
    code: "NGN",
  },
} as const

export const SUPPORTED_STABLECOINS = {
  fUSDC: {
    name: "Flow USDC",
    symbol: "fUSDC",
    decimals: 6,
  },
  fUSDT: {
    name: "Flow USDT",
    symbol: "fUSDT",
    decimals: 6,
  },
} as const

export const EXCHANGE_RATES = {
  // Mock exchange rates - in production, fetch from API
  NGN_TO_USD: 0.0024, // 1 NGN = 0.0024 USD (approx 1 USD = 416 NGN)
  USD_TO_NGN: 416,
} as const

export const FEES = {
  ON_RAMP_PERCENTAGE: 0.015, // 1.5%
  OFF_RAMP_PERCENTAGE: 0.015, // 1.5%
  MIN_FEE_USD: 0.5,
} as const

export const LIMITS = {
  MIN_ON_RAMP_NGN: 1000, // 1,000 NGN minimum
  MAX_ON_RAMP_NGN: 5000000, // 5,000,000 NGN maximum
  MIN_OFF_RAMP_USD: 5, // $5 minimum
  MAX_OFF_RAMP_USD: 10000, // $10,000 maximum
} as const

export const SERVICE_WALLET = {
  // Mock service wallet address for deposits
  ADDRESS: "0xFLOWRAMP_SERVICE_WALLET",
} as const

export const PAYMENT_PROVIDERS = {
  PAYSTACK: "paystack",
  FLUTTERWAVE: "flutterwave",
  STRIPE: "stripe",
} as const
