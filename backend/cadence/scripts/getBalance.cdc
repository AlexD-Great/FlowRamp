import "FungibleToken"
import "FungibleTokenConnectors"

import FUSD from 0xe223d8a629e49c68

access(all) fun main(address: Address): UFix64 {
  let account = getAccount(address)
  let vaultRef = account.getCapability(/public/fusdVault)
    .borrow<&FUSD.Vault{FungibleToken.Balance}>()
    ?? panic("Could not borrow Balance reference")
  
  return vaultRef.balance
}
