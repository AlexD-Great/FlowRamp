import FungibleToken from 0x9a0766d93b6608b7
import FungibleTokenMetadataViews from 0x9a0766d93b6608b7

/// Generic transaction to transfer any fungible token that implements the FungibleToken standard
/// This works with fUSDC, fUSDT, FLOW, and other FT tokens on testnet
///
/// @param amount: The amount of tokens to transfer
/// @param to: The recipient address
/// @param tokenIdentifier: The contract address and name (e.g., "A.b19436aae4d94622.FiatToken" for fUSDC)

transaction(amount: UFix64, to: Address, tokenIdentifier: String) {

    // The Vault resource that holds the tokens being transferred
    let sentVault: @{FungibleToken.Vault}

    prepare(signer: auth(BorrowValue) &Account) {
        
        // Parse token identifier to get contract address and name
        // Format: "A.{address}.{contractName}"
        let parts = tokenIdentifier.split(separator: ".")
        assert(parts.length == 3, message: "Invalid token identifier format")
        
        let contractAddress = Address.fromString("0x".concat(parts[1])) ?? panic("Invalid contract address")
        let contractName = parts[2]

        // Construct storage and public paths based on the contract name
        // Most tokens follow the pattern: /storage/{ContractName}Vault
        let vaultStoragePath = StoragePath(identifier: contractName.concat("Vault"))
            ?? panic("Could not construct vault storage path")
        
        let vaultPublicPath = PublicPath(identifier: contractName.concat("Receiver"))
            ?? panic("Could not construct vault public path")

        // Borrow a reference to the signer's stored vault
        let vaultRef = signer.storage.borrow<auth(FungibleToken.Withdraw) &{FungibleToken.Vault}>(
                from: vaultStoragePath
            ) ?? panic("Could not borrow reference to the owner's Vault at path: ".concat(vaultStoragePath.toString()))

        // Withdraw tokens from the signer's vault
        self.sentVault <- vaultRef.withdraw(amount: amount)
    }

    execute {
        // Get the recipient's public account object
        let recipient = getAccount(to)

        // Parse token identifier again for recipient lookup
        let parts = tokenIdentifier.split(separator: ".")
        let contractName = parts[2]
        
        let receiverPublicPath = PublicPath(identifier: contractName.concat("Receiver"))
            ?? panic("Could not construct receiver public path")

        // Borrow the recipient's public receiver capability
        let receiverRef = recipient.capabilities.borrow<&{FungibleToken.Receiver}>(receiverPublicPath)
            ?? panic("Could not borrow receiver reference for address: ".concat(to.toString()))

        // Deposit the withdrawn tokens to the recipient's vault
        receiverRef.deposit(from: <-self.sentVault)

        log("Transferred ".concat(amount.toString()).concat(" tokens to ").concat(to.toString()))
    }
}
