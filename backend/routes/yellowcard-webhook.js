const express = require("express");
const router = express.Router();
const crypto = require("crypto");
const { getDocument, updateDocument, queryDocuments } = require("../lib/firebase-admin");
const { ExchangeService } = require("../lib/exchange-service");

const exchangeService = new ExchangeService();

/**
 * Yellow Card Webhook Handler
 * 
 * Receives webhook events from Yellow Card for:
 *   - COLLECTION.COMPLETE — NGN collected from user (on-ramp) → trigger buy pipeline
 *   - COLLECTION.FAILED   — NGN collection failed
 *   - PAYMENT.COMPLETE    — NGN sent to user's bank (off-ramp) → mark completed
 *   - PAYMENT.FAILED      — NGN payout failed
 * 
 * Webhook signature: X-YC-Signature header = base64(hmac-sha256(body, secretKey))
 */

/**
 * Verify the Yellow Card webhook signature.
 */
function verifySignature(rawBody, signature) {
  const secretKey = process.env.YELLOWCARD_SECRET_KEY;
  if (!secretKey) {
    console.error("[YC-WEBHOOK] YELLOWCARD_SECRET_KEY not set — cannot verify signature");
    return false;
  }
  const bodyString = typeof rawBody === "string" ? rawBody : rawBody.toString("utf8");
  const expected = crypto
    .createHmac("sha256", secretKey)
    .update(bodyString)
    .digest("base64");
  return expected === signature;
}

/**
 * @route   POST /api/yc-webhook
 * @desc    Handle Yellow Card webhook events
 * @access  Public (verified via signature)
 * 
 * NOTE: This route uses express.raw() middleware to get the raw body
 *       for signature verification. It's mounted BEFORE express.json()
 *       in server.js.
 */
router.post("/", express.raw({ type: "application/json" }), async (req, res) => {
  try {
    const signature = req.headers["x-yc-signature"];
    const rawBody = req.body;

    // Verify signature
    if (!verifySignature(rawBody, signature)) {
      console.warn("[YC-WEBHOOK] Invalid signature — rejecting");
      return res.status(401).json({ error: "Invalid signature" });
    }

    const event = JSON.parse(rawBody.toString("utf8"));
    console.log(`[YC-WEBHOOK] Received event: ${event.event}, status: ${event.status}, id: ${event.id}`);

    // Route to appropriate handler
    switch (event.event) {
      case "COLLECTION.COMPLETE":
        await handleCollectionComplete(event);
        break;

      case "COLLECTION.FAILED":
        await handleCollectionFailed(event);
        break;

      case "PAYMENT.COMPLETE":
        await handlePaymentComplete(event);
        break;

      case "PAYMENT.FAILED":
        await handlePaymentFailed(event);
        break;

      default:
        console.log(`[YC-WEBHOOK] Unhandled event type: ${event.event}`);
    }

    // Always respond 200 to acknowledge receipt
    res.status(200).json({ received: true });

  } catch (error) {
    console.error("[YC-WEBHOOK] Error processing webhook:", error.message);
    // Still respond 200 to prevent YC from retrying
    res.status(200).json({ received: true, error: error.message });
  }
});

// ═══════════════════════════════════════════════════════════
// COLLECTION HANDLERS (On-ramp: user paid NGN)
// ═══════════════════════════════════════════════════════════

/**
 * Handle COLLECTION.COMPLETE — NGN has been collected from the user.
 * USD float is now credited. Trigger the buy pipeline.
 */
async function handleCollectionComplete(event) {
  const { id, sequenceId } = event;
  console.log(`[YC-WEBHOOK] Collection complete: ${id}, sequenceId: ${sequenceId}`);

  // sequenceId format: "onramp-{sessionId}"
  const sessionId = extractSessionId(sequenceId, "onramp-");
  if (!sessionId) {
    console.error(`[YC-WEBHOOK] Could not extract sessionId from sequenceId: ${sequenceId}`);
    return;
  }

  const session = await getDocument("onRampSessions", sessionId);
  if (!session) {
    console.error(`[YC-WEBHOOK] Session not found: ${sessionId}`);
    return;
  }

  // Only process if session is still awaiting collection
  if (session.status !== "awaiting_ngn_deposit" && session.status !== "collection_pending") {
    console.log(`[YC-WEBHOOK] Session ${sessionId} not in expected state (current: ${session.status}), skipping`);
    return;
  }

  // Update session — NGN collected successfully
  await updateDocument("onRampSessions", sessionId, {
    status: "ngn_deposit_confirmed",
    ycCollectionId: id,
    ycCollectionCompletedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  // Trigger the buy pipeline: buy FLOW on Bybit and withdraw to user
  try {
    await updateDocument("onRampSessions", sessionId, {
      status: "processing",
      pipelineStartedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // Execute async — don't block the webhook response
    exchangeService
      .executeBuyPipeline(sessionId, parseFloat(session.fiatAmount), session.walletAddress)
      .then((result) => {
        console.log(`[YC-WEBHOOK] Buy pipeline completed for ${sessionId}:`, result);
      })
      .catch((err) => {
        console.error(`[YC-WEBHOOK] Buy pipeline failed for ${sessionId}:`, err.message);
      });

  } catch (err) {
    console.error(`[YC-WEBHOOK] Error triggering buy pipeline for ${sessionId}:`, err.message);
  }
}

/**
 * Handle COLLECTION.FAILED — NGN collection failed.
 */
async function handleCollectionFailed(event) {
  const { id, sequenceId, errorCode } = event;
  console.error(`[YC-WEBHOOK] Collection FAILED: ${id}, error: ${errorCode}`);

  const sessionId = extractSessionId(sequenceId, "onramp-");
  if (!sessionId) return;

  const session = await getDocument("onRampSessions", sessionId);
  if (!session) return;

  await updateDocument("onRampSessions", sessionId, {
    status: "collection_failed",
    ycCollectionId: id,
    ycErrorCode: errorCode || "UNKNOWN",
    failedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
}

// ═══════════════════════════════════════════════════════════
// PAYMENT HANDLERS (Off-ramp: NGN sent to user's bank)
// ═══════════════════════════════════════════════════════════

/**
 * Handle PAYMENT.COMPLETE — NGN has been delivered to user's bank.
 * Mark the off-ramp request as fully completed.
 */
async function handlePaymentComplete(event) {
  const { id, sequenceId } = event;
  console.log(`[YC-WEBHOOK] Payment complete: ${id}, sequenceId: ${sequenceId}`);

  const requestId = extractSessionId(sequenceId, "offramp-");
  if (!requestId) {
    console.error(`[YC-WEBHOOK] Could not extract requestId from sequenceId: ${sequenceId}`);
    return;
  }

  const request = await getDocument("offRampRequests", requestId);
  if (!request) {
    console.error(`[YC-WEBHOOK] Request not found: ${requestId}`);
    return;
  }

  await updateDocument("offRampRequests", requestId, {
    status: "completed",
    ycPaymentCompletedAt: new Date().toISOString(),
    completedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  console.log(`[YC-WEBHOOK] Off-ramp request ${requestId} fully completed — NGN delivered to bank`);
}

/**
 * Handle PAYMENT.FAILED — NGN payout to user's bank failed.
 */
async function handlePaymentFailed(event) {
  const { id, sequenceId, errorCode } = event;
  console.error(`[YC-WEBHOOK] Payment FAILED: ${id}, error: ${errorCode}`);

  const requestId = extractSessionId(sequenceId, "offramp-");
  if (!requestId) return;

  const request = await getDocument("offRampRequests", requestId);
  if (!request) return;

  await updateDocument("offRampRequests", requestId, {
    status: "ngn_payout_failed",
    ycPaymentId: id,
    ycErrorCode: errorCode || "UNKNOWN",
    failedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
}

// ═══════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════

/**
 * Extract the session/request ID from a Yellow Card sequenceId.
 * @param {string} sequenceId - e.g. "onramp-abc123" or "offramp-xyz789"
 * @param {string} prefix - "onramp-" or "offramp-"
 * @returns {string|null}
 */
function extractSessionId(sequenceId, prefix) {
  if (!sequenceId || !sequenceId.startsWith(prefix)) return null;
  return sequenceId.slice(prefix.length);
}

module.exports = router;
