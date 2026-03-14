// lib/flow/config.ts
import { config } from "@onflow/fcl";

// Flow configuration for client-side interactions
// Values are read from environment variables set in .env.local
export const flowConfig = {
  accessNode: process.env.NEXT_PUBLIC_FLOW_ACCESS_NODE || "https://rest-mainnet.onflow.org",
  walletDiscovery: process.env.NEXT_PUBLIC_FLOW_DISCOVERY_WALLET || "https://fcl-discovery.onflow.org/authn",
  network: process.env.NEXT_PUBLIC_FLOW_NETWORK || "mainnet",
  contractAddress: process.env.NEXT_PUBLIC_FLOWRAMP_CONTRACT || "0x9368bdafca2eb2b5",
  appTitle: "FlowRamp",
  appIcon: "https://flowramp.xyz/favicon.ico",
}

// Configure FCL
config({
  "accessNode.api": flowConfig.accessNode,
  "discovery.wallet": flowConfig.walletDiscovery,
  "discovery.authn.endpoint": "https://fcl-discovery.onflow.org/api/authn",
  "flow.network": flowConfig.network,
  "app.detail.title": flowConfig.appTitle,
  "app.detail.icon": flowConfig.appIcon,
  "walletconnect.projectId": process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "",
});
