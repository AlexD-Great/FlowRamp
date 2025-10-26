import "FungibleToken"
import FUSD from 0xe223d8a629e49c68

access(all) fun main(address: Address): Bool {
  let account = getAccount(address)
  return account.getCapability(/public/fusdBalance).check<&FUSD.Vault{FungibleToken.Balance}>()
}
