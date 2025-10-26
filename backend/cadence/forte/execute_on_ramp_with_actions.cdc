import FungibleToken from 0xFUNGIBLETOKEN
import FungibleTokenConnectors from 0x5a7b9cee9aaf4e4e // Testnet address
import FlowRamp from 0xFLOWRAMP // Replace with your contract address

transaction(beneficiary: Address, amount: UFix64, sessionId: String, backendSig: String) {
    let source: @FungibleTokenConnectors.VaultSource
    let sink: &FungibleTokenConnectors.VaultSink

    prepare(serviceAccount: AuthAccount) {
        // Verify the backend signature
        // This is a placeholder for your actual signature verification logic
        assert(FlowRamp.verifySignature(sessionId, backendSig), message: "Invalid backend signature")

        // Create a Source from the service account's vault
        let vaultRef = serviceAccount.borrow<&FungibleToken.Vault>(from: /storage/serviceVault) // Adjust path
            ?? panic("Could not borrow reference to the service vault")
        
        self.source <- FungibleTokenConnectors.VaultSource(withdrawVault: vaultRef)

        // Create a Sink for the beneficiary's vault
        let receiverCap = getAccount(beneficiary)
            .getCapability<&{FungibleToken.Receiver}>(/public/fusdReceiver) // Adjust path
            ?? panic("Could not get receiver capability")
        
        self.sink = FungibleTokenConnectors.VaultSink(depositVault: receiverCap)
    }

    execute {
        // Withdraw from the service vault
        let tokens <- self.source.withdraw(amount: amount)

        // Deposit into the beneficiary's vault
        self.sink.deposit(from: <-tokens)

        // Emit completion event
        emit FlowRamp.OnRampCompleted(
            beneficiary: beneficiary,
            amount: amount,
            stablecoin: "FUSD",
            sessionId: sessionId,
            txHash: self.id.toString()
        )
    }
}
