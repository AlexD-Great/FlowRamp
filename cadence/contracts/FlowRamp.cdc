// FlowRamp.cdc
// This contract manages the events and signature verification for the FlowRamp service.

access(all) contract FlowRamp {

    // --- Events ---

    access(all) event OnRampCompleted(
        beneficiary: Address,
        amount: UFix64,
        stablecoin: String,
        sessionId: String,
        txHash: String
    )

    access(all) event OffRampInitiated(
        depositor: Address,
        amount: UFix64,
        stablecoin: String,
        memo: String,
        requestId: String,
        txHash: String
    )
    
    access(all) event DepositDetected(
        depositor: Address,
        amount: UFix64,
        token: String,
        memo: String
    )

    // --- Public Keys for Signature Verification ---

    // Mapping of public keys by a simple user-defined string key.
    // NOTE: We store the raw public key bytes as they are storable.
    access(all) var publicKeys: {String: [UInt8]}
    // --- Contract Initialization ---

    init() {
        self.publicKeys = {}
    }

    // --- Signature Verification ---

    // Verifies a signature against the stored public keys.
    access(all) fun verifySignature(keyIdentifier: String, signature: [UInt8], signedData: [UInt8]): Bool {
        // Get the raw public key bytes from storage
        let rawPublicKey = self.publicKeys[keyIdentifier]
            ?? panic("Public key with the specified identifier not found")

        // Create a PublicKey object on-the-fly from the stored bytes
        let key = PublicKey(
            publicKey: rawPublicKey,
            signatureAlgorithm: SignatureAlgorithm.ECDSA_P256 // Create the algorithm object here
        )

        // Verify the signature
        return key.verify(
            signature: signature,
            signedData: signedData,
            domainSeparationTag: "", // No tag needed for simple data
            hashAlgorithm: HashAlgorithm.SHA3_256
        )
    }

    // --- Public Key Management (Admin only) ---

    // Adds a new public key to the list of authorized keys.
    access(account) fun addPublicKey(keyIdentifier: String, publicKey: [UInt8]) {
        self.publicKeys[keyIdentifier] = publicKey
    }

    // Revokes a public key.
    access(account) fun revokePublicKey(keyIdentifier: String) {
        self.publicKeys.remove(key: keyIdentifier)
    }
}
