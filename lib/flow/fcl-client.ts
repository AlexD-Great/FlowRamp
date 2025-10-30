// Flow Client Library (FCL) wrapper for Flow blockchain interaction

import * as fcl from "@onflow/fcl"
import { flowConfig } from "./config"

export interface FlowUser {
  addr: string | null
  cid: string | null
  loggedIn: boolean
}

export class FCLClient {
  private static instance: FCLClient
  private initialized = false

  private constructor() {}

  static getInstance(): FCLClient {
    if (!FCLClient.instance) {
      FCLClient.instance = new FCLClient()
    }
    return FCLClient.instance
  }

  async initialize(): Promise<void> {
    if (this.initialized) return

    try {
      // Configure FCL with Flow network settings
      fcl.config({
        "accessNode.api": flowConfig.accessNode,
        "discovery.wallet": flowConfig.walletDiscovery,
        "app.detail.title": flowConfig.appTitle,
        "app.detail.icon": flowConfig.appIcon,
      })

      this.initialized = true
    } catch (error) {
      console.error("Failed to initialize FCL:", error)
      throw error
    }
  }

  async authenticate(): Promise<FlowUser> {
    await this.initialize()
    const user = await fcl.authenticate()
    return this.getCurrentUser()
  }

  async unauthenticate(): Promise<void> {
    await fcl.unauthenticate()
  }

  async getCurrentUser(): Promise<FlowUser> {
    const user = await fcl.currentUser.snapshot()
    return {
      addr: user.addr || null,
      cid: user.cid || null,
      loggedIn: user.loggedIn || false,
    }
  }

  async getBalance(address: string): Promise<string> {
    await this.initialize()

    const script = `
      import FungibleToken from 0xFungibleToken
      import FlowToken from 0xFlowToken

      access(all) fun main(address: Address): UFix64 {
        let account = getAccount(address)
        let vaultRef = account.capabilities
          .borrow<&FlowToken.Vault>(/public/flowTokenBalance)
          ?? panic("Could not borrow Balance reference")

        return vaultRef.balance
      }
    `

    try {
      const balance = await fcl.query({
        cadence: script,
        args: (arg: any, t: any) => [arg(address, t.Address)],
      })
      return balance
    } catch (error) {
      console.error("Failed to get balance:", error)
      return "0.0"
    }
  }

  async sendTransaction(
    cadence: string,
    args: (arg: any, t: any) => any[] = () => []
  ): Promise<string> {
    await this.initialize()

    try {
      const transactionId = await fcl.mutate({
        cadence,
        args,
        proposer: fcl.currentUser,
        payer: fcl.currentUser,
        authorizations: [fcl.currentUser],
        limit: 9999,
      })

      return transactionId
    } catch (error) {
      console.error("Transaction failed:", error)
      throw error
    }
  }

  async getTransactionStatus(transactionId: string): Promise<any> {
    await this.initialize()

    try {
      const status = await fcl.tx(transactionId).onceSealed()
      return status
    } catch (error) {
      console.error("Failed to get transaction status:", error)
      throw error
    }
  }

  async verifyWalletOwnership(): Promise<{ signature: string; message: string; address: string } | null> {
    await this.initialize()

    try {
      // Get current authenticated user - LIVE DATA from FCL
      const user = await this.getCurrentUser()
      if (!user.loggedIn || !user.addr) {
        throw new Error("User must be authenticated first")
      }

      console.log("[WALLET-VERIFY] User authenticated:", user.addr)

      // Create a message to sign for verification - LIVE TIMESTAMP
      const timestamp = Date.now()
      const message = `FlowRamp Wallet Verification\nTimestamp: ${timestamp}\nAddress: ${user.addr}`

      console.log("[WALLET-VERIFY] Requesting signature for message:", message)

      // Request user to sign the message - LIVE SIGNATURE from user's wallet
      // This will trigger the actual wallet popup (Blocto/Lilico/etc)
      const signatureResponse = await fcl.currentUser.signUserMessage(message)

      console.log("[WALLET-VERIFY] Signature response received:", signatureResponse)

      if (!signatureResponse || signatureResponse.length === 0) {
        throw new Error("Signature not provided by user")
      }

      // Validate that signature contains required fields
      if (!Array.isArray(signatureResponse)) {
        throw new Error("Invalid signature format")
      }

      // Return the LIVE signature data and message for backend verification
      return {
        signature: JSON.stringify(signatureResponse),
        message,
        address: user.addr,
      }
    } catch (error) {
      console.error("[WALLET-VERIFY] Verification failed:", error)
      throw error
    }
  }

  subscribeToUser(callback: (user: FlowUser) => void): () => void {
    const unsubscribe = fcl.currentUser.subscribe((fclUser: any) => {
      callback({
        addr: fclUser.addr || null,
        cid: fclUser.cid || null,
        loggedIn: fclUser.loggedIn || false,
      })
    })

    return unsubscribe
  }
}

export default FCLClient
