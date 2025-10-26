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

    // Mapping of key hashes to Public Key objects
    access(all) var publicKeys: {String: PublicKey}

    // --- Contract Initialization ---

    init() {
        self.publicKeys = {}
    }

    // --- Signature Verification ---

    // Verifies a signature against the stored public keys.
    // The backend will sign a message (e.g., the sessionId) and the contract will verify it.
    access(all) fun verifySignature(sessionId: String, signature: String): Bool {
        let signedData = sessionId.decodeHex()
        let signatureBytes = signature.decodeHex()

        // Iterate through the stored public keys and check for a valid signature
        for keyHash in self.publicKeys.keys {
            let publicKey = self.publicKeys[keyHash]!
            if publicKey.verify(signature: signatureBytes, signedData: signedData) {
                return true
            }
        }

        return false
    }

    // --- Public Key Management (Admin only) ---

    // Adds a new public key to the list of authorized keys.
    // This should only be callable by the contract owner.
    access(account) fun addPublicKey(publicKey: String) {
        let pubKey = PublicKey(
            publicKey: publicKey.decodeHex(),
            signatureAlgorithm: SignatureAlgorithm.ECDSA_P256
        )
        self.publicKeys[pubKey.hashAlgorithm.hash(data: pubKey.publicKey).toString()] = pubKey
    }

    // Revokes a public key.
    // This should only be callable by the contract owner.
    access(account) fun revokePublicKey(keyHash: String) {
        self.publicKeys.remove(key: keyHash)
    }
}
