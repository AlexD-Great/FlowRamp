// Application constants

const SUPPORTED_CURRENCIES = {
  NGN: {
    name: "Nigerian Naira",
    symbol: "₦",
    code: "NGN",
  },
};

const SUPPORTED_STABLECOINS = {
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
};

const EXCHANGE_RATES = {
  // Legacy mock rates — kept for backward compatibility.
  // Live rates are now fetched via RateProvider from Yellow Card + Bybit.
  NGN_TO_USD: 0.0006, // ~1 USD = 1650 NGN (approximate, updated)
  USD_TO_NGN: 1650,
};

const FEES = {
  ON_RAMP_PERCENTAGE: 0.015, // 1.5%
  OFF_RAMP_PERCENTAGE: 0.015, // 1.5%
  MIN_FEE_USD: 0.5,
};

const LIMITS = {
  MIN_ON_RAMP_NGN: 1000, // 1,000 NGN minimum
  MAX_ON_RAMP_NGN: 5000000, // 5,000,000 NGN maximum
  MIN_OFF_RAMP_USD: 5, // $5 minimum
  MAX_OFF_RAMP_USD: 10000, // $10,000 maximum
};

const SERVICE_WALLET = {
  // Flow blockchain service wallet for on-chain operations
  ADDRESS: process.env.FLOW_ACCOUNT_ADDRESS || "0xFLOWRAMP_SERVICE_WALLET",
};

// Exchange pipeline configuration
const EXCHANGE_CONFIG = {
  // Yellow Card — handles NGN fiat rails (collections & payments)
  YELLOW_CARD: {
    SANDBOX_URL: "https://sandbox.yellowcard.engineering",
    PRODUCTION_URL: "https://api.yellowcard.engineering",
    COUNTRY_CODE: "NG", // Nigeria
    CURRENCY: "NGN",
  },
  // Bybit — handles USDT ↔ FLOW trading
  BYBIT: {
    BASE_URL: "https://api.bybit.com",
    FLOW_USDT_SYMBOL: "FLOWUSDT",
    FLOW_WITHDRAW_CHAIN: "FLOW", // Flow blockchain native
  },
  // Pipeline settings
  PIPELINE: {
    DEPOSIT_POLL_INTERVAL_MS: 30000,  // 30 seconds (Bybit FLOW deposit polling)
    ORDER_FILL_TIMEOUT_MS: 60000,     // 60 seconds
    WITHDRAWAL_WAIT_TIMEOUT_MS: 600000, // 10 minutes
    BYBIT_FLOW_WITHDRAWAL_FEE: 0.1,   // Approximate Bybit FLOW withdrawal fee
    BYBIT_TRADING_FEE_PERCENT: 0.001, // 0.1% taker fee
    PLATFORM_FEE_PERCENT: 0.015,      // 1.5% platform fee
  },
};

const PAYMENT_PROVIDERS = {
  PAYSTACK: "paystack",
  FLUTTERWAVE: "flutterwave",
  STRIPE: "stripe",
};

module.exports = {
  SUPPORTED_CURRENCIES,
  SUPPORTED_STABLECOINS,
  EXCHANGE_RATES,
  FEES,
  LIMITS,
  SERVICE_WALLET,
  PAYMENT_PROVIDERS,
  EXCHANGE_CONFIG,
};
