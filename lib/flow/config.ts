// lib/flow/config.ts
import { config } from "@onflow/fcl";

// Flow configuration for client-side interactions
export const flowConfig = {
  accessNode: "https://rest-testnet.onflow.org",
  walletDiscovery: "https://fcl-discovery.onflow.org/testnet/authn",
  appTitle: "FlowRamp",
  appIcon: "https://flowramp.com/favicon.ico",
}

// Configure FCL
config({
  "accessNode.api": flowConfig.accessNode,
  "discovery.wallet": flowConfig.walletDiscovery,
  "app.detail.title": flowConfig.appTitle,
  "app.detail.icon": flowConfig.appIcon,
});
