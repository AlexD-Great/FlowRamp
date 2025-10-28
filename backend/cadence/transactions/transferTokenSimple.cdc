import FungibleToken from 0x9a0766d93b6608b7

/// Simple token transfer that works with the service account vault
/// This version is compatible with testnet fungible tokens
///
/// @param amount: The amount of tokens to transfer
/// @param to: The recipient address

transaction(amount: UFix64, to: Address) {

    let sentVault: @{FungibleToken.Vault}
    let receiverRef: &{FungibleToken.Receiver}

    prepare(signer: auth(BorrowValue) &Account) {
        // Try common vault paths - adjust based on your token
        // For testnet FLOW token:
        let vaultPath = /storage/flowTokenVault
        let receiverPath = /public/flowTokenReceiver
        
        // Borrow reference to sender's vault
        let vaultRef = signer.storage.borrow<auth(FungibleToken.Withdraw) &{FungibleToken.Vault}>(
            from: vaultPath
        ) ?? panic("Could not borrow reference to sender vault")

        // Withdraw tokens
        self.sentVault <- vaultRef.withdraw(amount: amount)

        // Get receiver capability
        let recipient = getAccount(to)
        self.receiverRef = recipient.capabilities.borrow<&{FungibleToken.Receiver}>(receiverPath)
            ?? panic("Could not borrow receiver reference")
    }

    execute {
        // Deposit tokens to receiver
        self.receiverRef.deposit(from: <-self.sentVault)
        
        log("Successfully transferred ".concat(amount.toString()).concat(" tokens to ").concat(to.toString()))
    }
}
