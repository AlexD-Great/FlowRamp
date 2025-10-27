import "FungibleToken"

// This generic script reads the balance of ANY fungible token vault in an account
// by using the standard FungibleToken.Balance interface.

access(all) fun main(address: Address, publicBalancePath: PublicPath): UFix64? {
    // Get the public account object for the address
    let account = getAccount(address)

    // Get the public capability for the vault's balance using the provided path
    let vaultCap = account.capabilities.get<&{FungibleToken.Balance}>(publicBalancePath)

    // If the capability doesn't exist or doesn't expose the correct interface, return nil
    if !vaultCap.check() {
        return nil
    }

    // Borrow a reference to the vault's balance
    let vaultRef = vaultCap.borrow()
        ?? panic("Could not borrow Balance reference from the capability")
    
    // Return the balance
    return vaultRef.balance
}