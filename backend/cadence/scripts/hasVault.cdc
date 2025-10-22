import FungibleToken from 0x9a0766d93b6608b7
import FUSD from 0xe223d8a629e49c68

pub fun main(address: Address): Bool {
  let account = getAccount(address)
  return account.getCapability(/public/fusdBalance).check<&FUSD.Vault{FungibleToken.Balance}>()
}
