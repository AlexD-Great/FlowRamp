import "FungibleToken"
import "SwapConfig"
import IncrementFiSwapConnectors from "0xINCREMENTFISWAPCONNECTORS"  // Replace with actual address

// Generic token imports - replace with actual token contracts you support


// This transaction executes a swap using a Flow Actions Swapper.
// It is signed by the user whose tokens are being swapped.
transaction(
    inTokenIdentifier: String,
    outTokenIdentifier: String,
    pathKeys: [String],
    fromAmount: UFix64,
    minAmountOut: UFix64
) {
    let swapper: IncrementFiSwapConnectors.Swapper
    let inVault: @{FungibleToken.Vault}
    let toReceiver: auth(FungibleToken.Receiver) &{FungibleToken.Receiver}

    prepare(signer: AuthAccount) {
        // 1. Instantiate the Swapper
        // We get the vault types dynamically from the identifiers provided.
        // This makes the transaction flexible.
        let inType = SwapConfig.getVaultType(identifier: inTokenIdentifier)
            ?? panic("Input token type not supported")
        let outType = SwapConfig.getVaultType(identifier: outTokenIdentifier)
            ?? panic("Output token type not supported")

        self.swapper = IncrementFiSwapConnectors.Swapper(
            path: pathKeys,
            inVault: inType,
            outVault: outType,
            uniqueID: nil
        )

        // 2. Withdraw the input tokens from the signer's vault
        // This uses the modern `storage.borrow` on an AuthAccount
        let fromVaultPath = SwapConfig.getStoragePath(identifier: inTokenIdentifier, usage: .Vault)
        let vaultRef = signer.storage.borrow<auth(FungibleToken.Withdraw) &{FungibleToken.Vault}>(from: fromVaultPath)
            ?? panic("Could not borrow a reference to the fromVault")
        self.inVault <- vaultRef.withdraw(amount: fromAmount)

        // 3. Get a reference to the signer's destination vault (receiver)
        // This also uses the modern `storage.borrow` on an AuthAccount
        let toVaultPath = SwapConfig.getStoragePath(identifier: outTokenIdentifier, usage: .Vault)
        self.toReceiver = signer.storage.borrow<auth(FungibleToken.Receiver) &{FungibleToken.Receiver}>(from: toVaultPath)
            ?? panic("Could not borrow a reference to the toReceiver")
    }

    execute {
        // 4. Execute the swap by calling the method on the Swapper instance
        let outVault <- self.swapper.swap(quote: nil, inVault: <- self.inVault)

        // 5. Security Check: Verify the output amount is sufficient
        assert(outVault.balance >= minAmountOut, message: "Swap failed to meet minimum amount out")

        // 6. Deposit the swapped tokens into the destination vault
        self.toReceiver.deposit(from: <- outVault)
    }
}