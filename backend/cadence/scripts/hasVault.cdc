import FungibleToken from 0xf233dcee88fe0abe

// Generic script to check if an account has a vault capability at a given path
access(all) fun main(address: Address, publicBalancePath: PublicPath): Bool {
  let account = getAccount(address)
  let vaultCap = account.capabilities.get<&{FungibleToken.Balance}>(publicBalancePath)
  return vaultCap.check()
}
