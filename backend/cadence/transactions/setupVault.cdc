import FungibleToken from 0x9a0766d93b6608b7
import FUSD from 0xe223d8a629e49c68

transaction {
  prepare(signer: AuthAccount) {
    // Check if vault already exists
    if signer.borrow<&FUSD.Vault>(from: /storage/fusdVault) == nil {
      // Create a new vault and save it
      signer.save(<-FUSD.createEmptyVault(), to: /storage/fusdVault)
      
      // Create a public capability for the vault
      signer.link<&FUSD.Vault{FungibleToken.Receiver}>(
        /public/fusdReceiver,
        target: /storage/fusdVault
      )
      
      signer.link<&FUSD.Vault{FungibleToken.Balance}>(
        /public/fusdBalance,
        target: /storage/fusdVault
      )
    }
  }
}
