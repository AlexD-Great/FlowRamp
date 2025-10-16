"use client"

// Flow Client Library (FCL) setup for wallet connection
// This runs on the client side for user wallet interactions

import * as fcl from "@onflow/fcl"
import * as t from "@onflow/types"

const FLOW_ACCESS_NODE = "https://rest-testnet.onflow.org"
const FLOW_WALLET_DISCOVERY = "https://fcl-discovery.onflow.org/testnet/authn"

export interface FlowUser {
  addr: string | null
  loggedIn: boolean
  cid?: string
  services?: any[]
}

export class FCLClient {
  private static instance: FCLClient
  private initialized = false
  private currentUser: FlowUser = { loggedIn: false, addr: null }

  private constructor() {}

  static getInstance(): FCLClient {
    if (!FCLClient.instance) {
      FCLClient.instance = new FCLClient()
    }
    return FCLClient.instance
  }

  async initialize() {
    if (this.initialized) return

    fcl
      .config()
      .put("accessNode.api", FLOW_ACCESS_NODE)
      .put("discovery.wallet", FLOW_WALLET_DISCOVERY)
      .put("app.detail.title", "FlowRamp")
      .put("app.detail.icon", "https://flowramp.com/favicon.ico")

    fcl.currentUser().subscribe((user) => {
      this.currentUser = {
        loggedIn: !!user.addr,
        addr: user.addr,
        cid: user.cid,
        services: user.services,
      }
    })

    this.initialized = true
    console.log("FCL Client initialized for Flow Testnet")
  }

  async authenticate(): Promise<FlowUser> {
    await this.initialize()
    await fcl.authenticate()
    return this.currentUser
  }

  async unauthenticate(): Promise<void> {
    await fcl.unauthenticate()
  }

  async getCurrentUser(): Promise<FlowUser> {
    return this.currentUser
  }

  async getAccount(address: string): Promise<any> {
    return fcl.account(address)
  }

  async sendTransaction(
    cadence: string,
    args: (sdkArg: any, t: any) => any[],
  ): Promise<string> {
    const authorization = fcl.authz
    const response = await fcl.mutate({
      cadence,
      args,
      proposer: authorization,
      payer: authorization,
      authorizations: [authorization],
      limit: 9999,
    })
    return response
  }

  async executeScript(cadence: string, args: (sdkArg: any, t: any) => any[]): Promise<any> {
    return fcl.query({
      cadence,
      args,
    })
  }

  async getTransactionStatus(txId: string): Promise<any> {
    return fcl.tx(txId).onceSealed()
  }
}
