import FungibleToken from 0xFUNGIBLETOKEN
import FUSD from 0xFUSD
import FlowRamp from 0xFLOWRAMP

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
