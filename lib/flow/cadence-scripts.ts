// Cadence scripts and transactions for Flow blockchain
// These are the actual smart contract interactions

export const CadenceScripts = {
  // Check fUSDC balance
  getBalance: (address: string, token: "fUSDC" | "fUSDT") => `
    import FungibleToken from 0xFUNGIBLETOKEN
    import ${token} from 0x${token}

    pub fun main(address: Address): UFix64 {
      let account = getAccount(address)
      let vaultRef = account.getCapability(${token}.VaultPublicPath)
        .borrow<&${token}.Vault{FungibleToken.Balance}>()
        ?? panic("Could not borrow Balance reference")
      
      return vaultRef.balance
    }
  `,

  // Check if account has vault setup
  hasVault: (address: string, token: "fUSDC" | "fUSDT") => `
    import ${token} from 0x${token}

    pub fun main(address: Address): Bool {
      let account = getAccount(address)
      return account.getCapability(${token}.VaultPublicPath).check<&${token}.Vault{FungibleToken.Balance}>()
    }
  `,
}

export const CadenceTransactions = {
  // Setup vault for receiving tokens
  setupVault: (token: "fUSDC" | "fUSDT") => `
    import FungibleToken from 0xFUNGIBLETOKEN
    import ${token} from 0x${token}

    transaction {
      prepare(signer: AuthAccount) {
        // Check if vault already exists
        if signer.borrow<&${token}.Vault>(from: ${token}.VaultStoragePath) == nil {
          // Create a new vault and save it
          signer.save(<-${token}.createEmptyVault(), to: ${token}.VaultStoragePath)
          
          // Create a public capability for the vault
          signer.link<&${token}.Vault{FungibleToken.Receiver}>(
            ${token}.ReceiverPublicPath,
            target: ${token}.VaultStoragePath
          )
          
          signer.link<&${token}.Vault{FungibleToken.Balance}>(
            ${token}.BalancePublicPath,
            target: ${token}.VaultStoragePath
          )
        }
      }
    }
  `,

  // Transfer tokens (for off-ramp deposit)
  transferTokens: (recipient: string, amount: number, token: "fUSDC" | "fUSDT", memo: string) => `
    import FungibleToken from 0xFUNGIBLETOKEN
    import ${token} from 0x${token}
    import FlowRamp from 0xFLOWRAMP

    transaction(recipient: Address, amount: UFix64, memo: String) {
      let sentVault: @FungibleToken.Vault
      
      prepare(signer: AuthAccount) {
        let vaultRef = signer.borrow<&${token}.Vault>(from: ${token}.VaultStoragePath)
          ?? panic("Could not borrow reference to the owner's Vault")
        
        self.sentVault <- vaultRef.withdraw(amount: amount)
      }
      
      execute {
        let receiverRef = getAccount(recipient)
          .getCapability(${token}.ReceiverPublicPath)
          .borrow<&{FungibleToken.Receiver}>()
          ?? panic("Could not borrow receiver reference")
        
        receiverRef.deposit(from: <-self.sentVault)
        
        // Emit event with memo for tracking
        emit FlowRamp.DepositDetected(
          depositor: self.account.address,
          amount: amount,
          token: "${token}",
          memo: memo
        )
      }
    }
  `,
}

// Forte Actions pseudocode (conceptual - actual implementation would be in Cadence)
export const ForteActions = {
  // On-Ramp Action: Mint/Transfer tokens to user
  executeOnRamp: `
    pub action FlowRamp.executeOnRamp(
      beneficiary: Address,
      amountUSD: UFix64,
      stablecoin: String,
      sessionId: String,
      backendSig: [UInt8]
    ) {
      // 1. Verify backend signature
      assert(self.verifySignature(sessionId, backendSig), message: "Invalid signature")
      
      // 2. Calculate stablecoin amount
      let tokenAmount = self.convertUSDToToken(amountUSD, stablecoin)
      
      // 3. Transfer from service vault to beneficiary
      let serviceVault = self.account.borrow<&FungibleToken.Vault>(from: ServiceVaultPath)
        ?? panic("Could not borrow service vault")
      
      let tokens <- serviceVault.withdraw(amount: tokenAmount)
      
      let receiverRef = getAccount(beneficiary)
        .getCapability(ReceiverPublicPath)
        .borrow<&{FungibleToken.Receiver}>()
        ?? panic("Could not borrow receiver")
      
      receiverRef.deposit(from: <-tokens)
      
      // 4. Emit completion event
      emit OnRampCompleted(
        beneficiary: beneficiary,
        amount: tokenAmount,
        stablecoin: stablecoin,
        sessionId: sessionId,
        txHash: self.txHash
      )
    }
  `,

  // Off-Ramp Action: Burn/Escrow tokens
  executeOffRamp: `
    pub action FlowRamp.executeOffRamp(
      depositor: Address,
      amount: UFix64,
      stablecoin: String,
      memo: String,
      requestId: String
    ) {
      // 1. Verify deposit was received with correct memo
      assert(self.verifyDeposit(depositor, amount, memo), message: "Deposit not verified")
      
      // 2. Burn or escrow tokens
      let escrowVault = self.account.borrow<&FungibleToken.Vault>(from: EscrowVaultPath)
        ?? panic("Could not borrow escrow vault")
      
      // Tokens are already in escrow from deposit, just lock them
      
      // 3. Emit event for backend to process payout
      emit OffRampInitiated(
        depositor: depositor,
        amount: amount,
        stablecoin: stablecoin,
        memo: memo,
        requestId: requestId,
        txHash: self.txHash
      )
    }
  `,
}
