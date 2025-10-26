// This transaction executes a swap on a DEX
// It uses the SwapConnectors contract to execute the swap

import "FungibleToken"
import "SwapConnectors"

transaction(
    fromToken: String,
    toToken: String,
    fromAmount: UFix64,
    minAmountOut: UFix64
) {
    let fromVault: @{FungibleToken.Vault}
    let toReceiver: &{FungibleToken.Vault}

    prepare(signer: &Account) {
        // Get the path for the vault
        let fromVaultPath = SwapConnectors.getVaultPath(fromToken)

        // Borrow a reference to the vault by its Provider interface
        let vaultRef = signer.borrow<&{FungibleToken.Vault}>(from: fromVaultPath)
            ?? panic("Could not borrow a reference to the vault")

        // Withdraw the tokens from the vault
        self.fromVault <- vaultRef.withdraw(amount: fromAmount)

        // Get the path for the receiver
        let toReceiverPath = SwapConnectors.getReceiverPath(toToken)

        // Borrow a reference to the receiver capability
        self.toReceiver = signer.getCapability(toReceiverPath).borrow<&{FungibleToken.Vault}>()
            ?? panic("Could not borrow receiver")
    }

    execute {
        // Execute the swap
        let toVault <- SwapConnectors.swap(
            fromVault: <- self.fromVault,
            toToken: toToken,
            minAmountOut: minAmountOut
        )

        // Deposit the swapped tokens
        self.toReceiver.deposit(from: <- toVault)
    }
}
