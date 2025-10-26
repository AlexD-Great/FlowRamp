import FungibleToken from 0xFUNGIBLETOKEN
import FungibleTokenConnectors from 0x5a7b9cee9aaf4e4e // Testnet address
import FlowRamp from 0xFLOWRAMP // Replace with your contract address

transaction(recipient: Address, amount: UFix64, memo: String) {
    let source: @FungibleTokenConnectors.VaultSource
    let sink: &FungibleTokenConnectors.VaultSink

    prepare(signer: AuthAccount) {
        // Create a Source from the signer's vault
        let vaultRef = signer.borrow<&FungibleToken.Vault>(from: /storage/fusdVault) // Adjust path as needed
            ?? panic("Could not borrow reference to the owner's Vault")
        
        self.source <- FungibleTokenConnectors.VaultSource(withdrawVault: vaultRef)

        // Create a Sink for the recipient's vault
        let receiverCap = getAccount(recipient)
            .getCapability<&{FungibleToken.Receiver}>(/public/fusdReceiver) // Adjust path as needed
            ?? panic("Could not get receiver capability")
        
        self.sink = FungibleTokenConnectors.VaultSink(depositVault: receiverCap)
    }

    execute {
        // Withdraw from the source
        let tokens <- self.source.withdraw(amount: amount)

        // Deposit into the sink
        self.sink.deposit(from: <-tokens)

        // Emit event with memo for tracking
        emit FlowRamp.DepositDetected(
            depositor: signer.address,
            amount: amount,
            token: "FUSD",
            memo: memo
        )
    }
}
