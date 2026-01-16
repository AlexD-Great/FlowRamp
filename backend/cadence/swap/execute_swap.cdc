import "FungibleToken"
import "SwapConfig"
import IncrementFiSwapConnectors from 0x49bae091e5ea16b5
import FlowRamp from 0xb30759ba587f6650
import FlowToken from 0x7e60df042a9c0868

// This transaction executes a swap using IncrementFi Swap Connectors.
// It supports FLOW tokens and other FT tokens on Flow testnet.
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
    let toReceiver: &{FungibleToken.Receiver}
    let signerAddress: Address
    let actualOutAmount: UFix64

    prepare(signer: auth(BorrowValue, Storage) &Account) {
        // Store signer address for event emission
        self.signerAddress = signer.address

        // 1. Instantiate the Swapper
        // We get the vault types dynamically from the identifiers provided.
        // This makes the transaction flexible and supports FLOW tokens.
        let inType = SwapConfig.getVaultType(identifier: inTokenIdentifier)
            ?? panic("Input token type not supported: ".concat(inTokenIdentifier))
        let outType = SwapConfig.getVaultType(identifier: outTokenIdentifier)
            ?? panic("Output token type not supported: ".concat(outTokenIdentifier))

        self.swapper = IncrementFiSwapConnectors.Swapper(
            path: pathKeys,
            inVault: inType,
            outVault: outType,
            uniqueID: nil
        )

        // 2. Withdraw the input tokens from the signer's vault
        let fromVaultPath = SwapConfig.getStoragePath(identifier: inTokenIdentifier, usage: SwapConfig.PathUsage.Vault)
        let vaultRef = signer.storage.borrow<auth(FungibleToken.Withdraw) &{FungibleToken.Vault}>(from: fromVaultPath)
            ?? panic("Could not borrow a reference to the vault at path: ".concat(fromVaultPath.toString()))
        self.inVault <- vaultRef.withdraw(amount: fromAmount)

        // 3. Get a reference to the signer's destination vault (receiver)
        let toVaultPath = SwapConfig.getStoragePath(identifier: outTokenIdentifier, usage: SwapConfig.PathUsage.Vault)
        self.toReceiver = signer.storage.borrow<&{FungibleToken.Receiver}>(from: toVaultPath)
            ?? panic("Could not borrow a reference to the receiver at path: ".concat(toVaultPath.toString()))
        
        // Initialize actualOutAmount
        self.actualOutAmount = 0.0
    }

    execute {
        // 4. Execute the swap by calling the method on the Swapper instance
        let outVault <- self.swapper.swap(quote: nil, inVault: <- self.inVault)

        // 5. Security Check: Verify the output amount is sufficient
        assert(outVault.balance >= minAmountOut, message: "Swap failed to meet minimum amount out. Expected >= ".concat(minAmountOut.toString()).concat(", got ").concat(outVault.balance.toString()))

        // Store the actual output amount for event emission
        self.actualOutAmount = outVault.balance

        // 6. Deposit the swapped tokens into the destination vault
        self.toReceiver.deposit(from: <- outVault)

        // 7. Emit swap event for tracking
        emit FlowRamp.FlowSwapExecuted(
            user: self.signerAddress,
            fromToken: inTokenIdentifier,
            toToken: outTokenIdentifier,
            fromAmount: fromAmount,
            toAmount: self.actualOutAmount,
            txHash: ""
        )
    }

    post {
        // Ensure swap was successful
        self.actualOutAmount >= minAmountOut: "Swap did not meet minimum output requirement"
    }
}