import FungibleToken from 0xFUNGIBLETOKEN
import FUSD from 0xFUSD
import FlowRamp from 0xFLOWRAMP

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
