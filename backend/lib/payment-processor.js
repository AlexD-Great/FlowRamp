const { getDocument, updateDocument } = require("./firebase-admin");
const { ExchangeService } = require("./exchange-service");

const exchangeService = new ExchangeService();

/**
 * Process a paid on-ramp session by executing the exchange pipeline:
 *   NGN (Yellow Card collection) → USD float → USDT (Bybit) → FLOW → user wallet
 * 
 * Called when:
 *   - Yellow Card webhook confirms NGN collection, OR
 *   - An admin manually approves/triggers processing for a session
 * 
 * @param {string} sessionId - The Firestore document ID of the on-ramp session
 */
async function processPayment(sessionId) {
  try {
    console.log(`[PROCESSOR] Starting payment processing for session: ${sessionId}`);

    const session = await getDocument("onRampSessions", sessionId);

    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    // Allow processing from multiple valid states
    const validStatuses = ["processing", "ngn_deposit_confirmed"];
    if (!validStatuses.includes(session.status)) {
      console.log(`[PROCESSOR] Session ${sessionId} not ready (current: ${session.status})`);
      return;
    }

    // Execute the full buy pipeline via exchange service
    const result = await exchangeService.executeBuyPipeline(
      sessionId,
      parseFloat(session.fiatAmount),
      session.walletAddress
    );

    console.log(`[PROCESSOR] Payment processed for session ${sessionId}:`, {
      flowDelivered: result.flowDelivered,
      txHash: result.txHash,
    });

    return result;

  } catch (error) {
    console.error(`[PROCESSOR] Error processing payment for session ${sessionId}:`, error);

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
 * Process off-ramp payout via exchange pipeline:
 *   FLOW (on Bybit) → USDT (Bybit) → Yellow Card payment → NGN to user's bank
 * 
 * Called when:
 *   - The deposit monitor detects a matching FLOW deposit on Bybit, OR
 *   - An admin manually approves/triggers processing for a request
 * 
 * @param {string} requestId - The off-ramp request ID
 */
async function processOffRampPayout(requestId) {
  try {
    console.log(`[PROCESSOR] Processing off-ramp payout for request: ${requestId}`);

    const request = await getDocument("offRampRequests", requestId);

    if (!request) {
      throw new Error(`Off-ramp request ${requestId} not found`);
    }

    const validStatuses = ["processing", "flow_deposit_confirmed"];
    if (!validStatuses.includes(request.status)) {
      console.log(`[PROCESSOR] Request ${requestId} not ready (current: ${request.status})`);
      return;
    }

    if (!request.payoutDetails || !request.payoutDetails.account_number) {
      throw new Error(`Request ${requestId} missing bank payout details`);
    }

    // Execute the full sell pipeline via exchange service
    const result = await exchangeService.executeSellPipeline(
      requestId,
      parseFloat(request.amount),
      request.payoutDetails
    );

    console.log(`[PROCESSOR] Off-ramp payout processed for request ${requestId}:`, {
      ngnSent: result.ngnSent,
      flowSold: result.flowSold,
    });

    return result;

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
};
