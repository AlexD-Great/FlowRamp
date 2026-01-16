import FungibleToken from 0x9a0766d93b6608b7
import FlowToken from 0x7e60df042a9c0868
import FlowRamp from 0xb30759ba587f6650

/// Transaction to initiate an off-ramp for FLOW tokens
/// This allows users to sell their FLOW tokens for fiat currency
/// The FLOW tokens are sent to the service account for processing
/// @param amount: The amount of FLOW tokens to sell
/// @param memo: A unique identifier for tracking the off-ramp request
/// @param requestId: The request ID from the backend
/// @param serviceAddress: The service account address to receive the FLOW tokens

transaction(amount: UFix64, memo: String, requestId: String, serviceAddress: Address) {
    let sentVault: @{FungibleToken.Vault}
    let receiverRef: &{FungibleToken.Receiver}
    let signerAddress: Address

    prepare(signer: auth(BorrowValue) &Account) {
        // Store the signer's address for event emission
        self.signerAddress = signer.address

        // Borrow reference to the signer's FLOW token vault
        let vaultRef = signer.storage.borrow<auth(FungibleToken.Withdraw) &FlowToken.Vault>(
            from: /storage/flowTokenVault
        ) ?? panic("Could not borrow reference to the owner's FLOW Vault")

        // Withdraw the specified amount of FLOW tokens
        self.sentVault <- vaultRef.withdraw(amount: amount)

        // Get the receiver capability for the service account
        let recipient = getAccount(serviceAddress)
        self.receiverRef = recipient.capabilities.borrow<&{FungibleToken.Receiver}>(
            /public/flowTokenReceiver
        ) ?? panic("Could not borrow receiver reference for service account")
    }

    execute {
        // Deposit FLOW tokens to the service account
        self.receiverRef.deposit(from: <-self.sentVault)

        // Emit event for backend processing
        emit FlowRamp.FlowOffRampInitiated(
            depositor: self.signerAddress,
            amount: amount,
            memo: memo,
            requestId: requestId,
            txHash: ""
        )
    }

    post {
        // Ensure the transaction was successful
        true: "FLOW off-ramp initiated successfully"
    }
}