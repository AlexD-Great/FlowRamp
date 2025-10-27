import "FungibleToken"
import FUSD from 0xFUSD
import FlowRamp from 0xFLOWRAMP

transaction(recipient: Address, amount: UFix64, memo: String) {
  let sentVault: @FungibleToken.Vault
  
  prepare(signer: AuthAccount) {
    let vaultRef = signer.borrow<&FUSD.Vault>(from: FUSD.VaultStoragePath)
      ?? panic("Could not borrow reference to the owner's Vault")
    
    self.sentVault <- vaultRef.withdraw(amount: amount)
  }
  
  execute {
    let receiverRef = getAccount(recipient)
      .getCapability(FUSD.ReceiverPublicPath)
      .borrow<&{FungibleToken.Receiver}>()
      ?? panic("Could not borrow receiver reference")
    
    receiverRef.deposit(from: <-self.sentVault)
    
    // Emit event with memo for tracking
    emit FlowRamp.DepositDetected(
      depositor: self.account.address,
      amount: amount,
      token: "FUSD",
      memo: memo
    )
  }
}
