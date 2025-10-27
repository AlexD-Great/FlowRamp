import "FungibleToken"
import "FungibleTokenConnectors"// Testnet address
import FlowRamp from 0xFLOWRAMP // Replace with your contract address

transaction(amount: UFix64, memo: String, requestId: String) {
    let source: @FungibleTokenConnectors.VaultSource
    let sink: &FungibleTokenConnectors.VaultSink

    prepare(signer: AuthAccount) {
        // Create a Source from the signer's (user's) vault
        let vaultRef = signer.borrow<&FungibleToken.Vault>(from: /storage/fusdVault) // Adjust path
            ?? panic("Could not borrow reference to the user's Vault")
        
        self.source <- FungibleTokenConnectors.VaultSource(withdrawVault: vaultRef)

        // Create a Sink for the service's escrow vault
        // This assumes the service has a public receiver capability at a known address
        let serviceAddress = 0xFLOWRAMP // Replace with your service account address
        let receiverCap = getAccount(serviceAddress)
            .getCapability<&{FungibleToken.Receiver}>(/public/escrowReceiver) // Adjust path
            ?? panic("Could not get service's escrow receiver capability")
        
        self.sink = FungibleTokenConnectors.VaultSink(depositVault: receiverCap)
    }

    execute {
        // Withdraw from the user's vault
        let tokens <- self.source.withdraw(amount: amount)

        // Deposit into the service's escrow vault
        self.sink.deposit(from: <-tokens)

        // Emit event for the backend to process the payout
        emit FlowRamp.OffRampInitiated(
            depositor: signer.address,
            amount: amount,
            stablecoin: "FUSD",
            memo: memo,
            requestId: requestId,
            txHash: self.id.toString()
        )
    }
}
