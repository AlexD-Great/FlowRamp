// lib/flow/config.ts
import { config } from "@onflow/fcl";

// Flow configuration for client-side interactions
// Values are read from environment variables set in .env.local
export const flowConfig = {
  accessNode: process.env.NEXT_PUBLIC_FLOW_ACCESS_NODE || "https://rest-mainnet.onflow.org",
  walletDiscovery: process.env.NEXT_PUBLIC_FLOW_DISCOVERY_WALLET || "https://fcl-discovery.onflow.org/authn",
  network: process.env.NEXT_PUBLIC_FLOW_NETWORK || "mainnet",
  appTitle: "FlowRamp",
  appIcon: "https://flowramp.com/favicon.ico",
}

// Configure FCL
config({
  "accessNode.api": flowConfig.accessNode,
  "discovery.wallet": flowConfig.walletDiscovery,
  "flow.network": flowConfig.network,
  "app.detail.title": flowConfig.appTitle,
  "app.detail.icon": flowConfig.appIcon,
});
