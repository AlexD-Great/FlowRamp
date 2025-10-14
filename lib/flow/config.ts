// Flow blockchain configuration
// FCL (Flow Client Library) configuration for wallet connection

export const FLOW_CONFIG = {
  // Network configuration
  accessNode: {
    api: process.env.NEXT_PUBLIC_FLOW_ACCESS_NODE || "https://rest-testnet.onflow.org",
    network: (process.env.NEXT_PUBLIC_FLOW_NETWORK as "testnet" | "mainnet") || "testnet",
  },

  // Discovery wallet configuration for FCL
  discovery: {
    wallet: process.env.NEXT_PUBLIC_FLOW_DISCOVERY_WALLET || "https://fcl-discovery.onflow.org/testnet/authn",
    authn: process.env.NEXT_PUBLIC_FLOW_DISCOVERY_AUTHN || "https://fcl-discovery.onflow.org/testnet/authn",
  },

  // Contract addresses (update with actual deployed contracts)
  contracts: {
    FlowRamp: process.env.NEXT_PUBLIC_FLOWRAMP_CONTRACT || "0xFLOWRAMP",
    fUSDC: process.env.NEXT_PUBLIC_FUSDC_CONTRACT || "0xFUSDC",
    fUSDT: process.env.NEXT_PUBLIC_FUSDT_CONTRACT || "0xFUSDT",
  },

  // Service account (backend only - never expose private key)
  serviceAccount: {
    address: process.env.FLOW_SERVICE_ACCOUNT_ADDRESS || "0xSERVICE",
    // Private key should be in secure environment variable
    privateKey: process.env.FLOW_SERVICE_ACCOUNT_PRIVATE_KEY || "",
  },
} as const

export const FLOW_EVENTS = {
  OnRampCompleted: "FlowRamp.OnRampCompleted",
  OffRampInitiated: "FlowRamp.OffRampInitiated",
  DepositDetected: "FlowRamp.DepositDetected",
} as const
