// lib/flow/config.ts
import { config } from "@onflow/fcl";

// This file configures FCL for client-side interactions.

config({
  // Point FCL to the correct Flow testnet access node.
  "accessNode.api": "https://rest-testnet.onflow.org",
  
  // Point FCL to the correct wallet discovery endpoint for testnet.
  "discovery.wallet": "https://fcl-discovery.onflow.org/testnet/authn",

  // Add application metadata
  "app.detail.title": "FlowRamp",
  "app.detail.icon": "https://flowramp.com/favicon.ico", // Replace with your actual icon URL
});
