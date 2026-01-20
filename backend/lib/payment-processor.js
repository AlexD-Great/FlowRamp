const { getDocument, updateDocument } = require("./firebase-admin");
const { ForteActionsService } = require("./forte-actions");
const fcl = require("@onflow/fcl");
const { SERVICE_WALLET } = require("./constants");
const { PaymentProvider } = require("./payment-provider");

const forte = new ForteActionsService();
const paymentProvider = new PaymentProvider();

/**
 * Process a paid on-ramp session by minting/transferring stablecoins to user
 * @param {string} sessionId - The Firestore document ID of the on-ramp session
 */
async function processPayment(sessionId) {
  try {
    console.log(`[PROCESSOR] Starting payment processing for session: ${sessionId}`);

    // Get the session details
    const session = await getDocument("onRampSessions", sessionId);

    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    // Verify session is in processing status (approved by admin)
    if (session.status !== "processing") {
      console.log(`[PROCESSOR] Session ${sessionId} is not in processing status (current: ${session.status})`);
      return;
    }

    // Execute blockchain transaction to transfer stablecoins
    const txHash = await executeStablecoinTransfer(session);

    // Update session with transaction hash and completed status
    await updateDocument("onRampSessions", sessionId, {
      status: "completed",
      txHash: txHash,
      completedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    console.log(`[PROCESSOR] Payment processed successfully for session ${sessionId}. TxHash: ${txHash}`);

  } catch (error) {
    console.error(`[PROCESSOR] Error processing payment for session ${sessionId}:`, error);

    // Update session with error status
    try {
      await updateDocument("onRampSessions", sessionId, {
        status: "failed",
        error: error.message,
        failedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    } catch (updateError) {
      console.error(`[PROCESSOR] Failed to update session status:`, updateError);
    }

    throw error;
  }
}

/**
 * Execute the blockchain transaction to transfer tokens
 * @param {Object} session - The on-ramp session data
 * @returns {Promise<string>} - The transaction hash
 */
async function executeStablecoinTransfer(session) {
  const { walletAddress, usdAmount, stablecoin, fiatAmount } = session;

  console.log(`[PROCESSOR] User paid ${fiatAmount} NGN (≈$${usdAmount} USD)`);
  console.log(`[PROCESSOR] Transferring ${usdAmount} FLOW tokens to ${walletAddress}`);

  // Configure FCL for testnet
  fcl.config({
    "accessNode.api": process.env.FLOW_ACCESS_NODE || "https://rest-testnet.onflow.org",
    "flow.network": process.env.FLOW_NETWORK || "testnet",
  });

  try {
    // Read the transfer transaction from file
    const fs = require("fs");
    const path = require("path");
    const cadencePath = path.join(__dirname, "../cadence/transactions/transferTokenSimple.cdc");
    const cadenceCode = fs.readFileSync(cadencePath, "utf8");

    // Service account authorization
    const serviceAccountAuth = async (account = {}) => {
      const privateKey = process.env.FLOW_PRIVATE_KEY;
      const accountAddress = process.env.FLOW_ACCOUNT_ADDRESS;
      
      if (!privateKey || !accountAddress) {
        throw new Error("Missing FLOW_PRIVATE_KEY or FLOW_ACCOUNT_ADDRESS in environment");
      }

      // Remove 0x prefix if present
      const cleanPrivateKey = privateKey.replace(/^0x/, "");
      const cleanAddress = accountAddress.replace(/^0x/, "");

      console.log(`[PROCESSOR] Using service account: 0x${cleanAddress}`);
      console.log(`[PROCESSOR] Private key length: ${cleanPrivateKey.length} chars`);

      return {
        ...account,
        tempId: `${cleanAddress}-service`,
        addr: fcl.sansPrefix(cleanAddress),
        keyId: 0,
        signingFunction: async (signable) => {
          const { sign } = require("../lib/crypto");
          console.log(`[PROCESSOR] Signing message...`);
          
          const signature = sign(cleanPrivateKey, signable.message);
          console.log(`[PROCESSOR] Signature generated (length: ${signature.length} chars)`);
          
          return {
            addr: fcl.withPrefix(cleanAddress),
            keyId: 0,
            signature: signature,
          };
        },
      };
    };

    // Calculate the actual FLOW amount to send
    // For now, we're sending FLOW tokens equivalent to USD amount
    // In production, you might want to use an oracle or fixed rate
    const flowAmount = parseFloat(usdAmount);
    const formattedAmount = flowAmount.toFixed(8);
    
    console.log(`[PROCESSOR] Sending ${formattedAmount} FLOW tokens to ${walletAddress}`);
    console.log(`[PROCESSOR] Service account: ${process.env.FLOW_ACCOUNT_ADDRESS}`);

    // Execute the transaction
    const txId = await fcl.mutate({
      cadence: cadenceCode,
      args: (arg, t) => [
        arg(formattedAmount, t.UFix64),
        arg(walletAddress, t.Address),
      ],
      proposer: serviceAccountAuth,
      payer: serviceAccountAuth,
      authorizations: [serviceAccountAuth],
      limit: 9999,
    });

    console.log(`[PROCESSOR] Transaction submitted with ID: ${txId}`);

    // Wait for the transaction to be sealed (confirmed)
    console.log(`[PROCESSOR] Waiting for transaction to be sealed...`);
    const txStatus = await fcl.tx(txId).onceSealed();

    if (txStatus.errorMessage) {
      throw new Error(`Transaction failed: ${txStatus.errorMessage}`);
    }

    console.log(`[PROCESSOR] Transaction sealed successfully! TxID: ${txId}`);
    return txId;

  } catch (error) {
    console.error("[PROCESSOR] Error executing blockchain transfer:", error);
    console.error("[PROCESSOR] Error details:", {
      message: error.message,
      stack: error.stack,
    });
    throw new Error(`Blockchain transfer failed: ${error.message}`);
  }
}

/**
 * Process off-ramp payout via Paystack transfer
 * @param {string} requestId - The off-ramp request ID
 * @param {Object} payoutDetails - Bank account details
 */
async function processOffRampPayout(requestId, payoutDetails) {
  try {
    console.log(`[PROCESSOR] Processing off-ramp payout for request: ${requestId}`);

    const request = await getDocument("offRampRequests", requestId);

    if (!request) {
      throw new Error(`Off-ramp request ${requestId} not found`);
    }

    // Verify the request has been approved by admin
    if (request.status !== "processing") {
      console.log(`[PROCESSOR] Request ${requestId} is not in processing status (current: ${request.status})`);
      return;
    }

    // Calculate USDT amount based on FLOW tokens deposited
    // In production, you'd use a proper price oracle
    const flowAmount = parseFloat(request.amount);
    const usdtAmount = flowAmount * 0.8; // Assuming 1 FLOW = 0.8 USDT for demo
    
    // Initiate Paystack transfer to user's bank account
    const transferData = {
      source: "balance", // Use your Paystack balance
      amount: Math.round(usdtAmount * 100), // Convert to kobo/cents
      recipient: payoutDetails.recipient_code, // You'll need to create this
      reason: `FlowRamp Off-ramp - Request ${requestId}`,
      reference: `offramp_${requestId}_${Date.now()}`,
    };

    console.log(`[PROCESSOR] Initiating Paystack transfer:`, transferData);
    
    const transfer = await paymentProvider.initiateTransfer(transferData);
    
    // Store the transfer reference for webhook tracking
    await updateDocument("offRampRequests", requestId, {
      status: "payout_sent",
      payoutRef: transfer.reference,
      payoutAmount: usdtAmount,
      payoutInitiatedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    console.log(`[PROCESSOR] Off-ramp payout initiated for request ${requestId}, reference: ${transfer.reference}`);

  } catch (error) {
    console.error(`[PROCESSOR] Error processing off-ramp payout for request ${requestId}:`, error);

    try {
      await updateDocument("offRampRequests", requestId, {
        status: "failed",
        error: error.message,
        failedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    } catch (updateError) {
      console.error(`[PROCESSOR] Failed to update request status:`, updateError);
    }

    throw error;
  }
}

module.exports = {
  processPayment,
  processOffRampPayout,
  executeStablecoinTransfer,
};
