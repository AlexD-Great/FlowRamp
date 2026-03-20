const express = require("express");
const router = express.Router();
const { PaymentProvider } = require("../lib/payment-provider");
const { getDocument, updateDocument, queryDocuments } = require("../lib/firebase-admin");
const { notifyNewBuyOrder } = require("../lib/notifier");

const paymentProvider = new PaymentProvider();

/**
 * @route   POST /api/webhook/paystack
 * @desc    Handle Paystack webhook events (payment confirmations, transfer updates).
 *          - charge.success: User paid NGN for on-ramp → mark session as awaiting_admin_approval
 *          - transfer.success: NGN payout sent for off-ramp → mark request as completed
 *          - transfer.failed: NGN payout failed → mark request as failed
 * @access  Public (verified with HMAC signature)
 */
router.post("/paystack", express.raw({ type: "application/json" }), async (req, res) => {
  try {
    const signature = req.headers["x-paystack-signature"];

    if (!signature) {
      console.error("[WEBHOOK] Missing Paystack signature");
      return res.status(400).json({ error: "Missing signature" });
    }

    // Verify webhook signature
    const payload = req.body.toString();
    const event = JSON.parse(payload);
    const isValid = paymentProvider.verifyWebhookSignature(signature, event);

    if (!isValid) {
      console.error("[WEBHOOK] Invalid Paystack signature");
      return res.status(401).json({ error: "Invalid signature" });
    }

    console.log("[WEBHOOK] Received Paystack event:", event.event);

    switch (event.event) {
      case "charge.success":
        await handleChargeSuccess(event.data);
        break;

      case "transfer.success":
        await handleTransferSuccess(event.data);
        break;

      case "transfer.failed":
        await handleTransferFailed(event.data);
        break;

      case "transfer.reversed":
        await handleTransferFailed(event.data);
        break;

      default:
        console.log(`[WEBHOOK] Unhandled event type: ${event.event}`);
    }

    // Always respond 200 to acknowledge receipt
    res.status(200).json({ status: "success" });
  } catch (error) {
    console.error("[WEBHOOK] Error processing webhook:", error);
    // Still return 200 to prevent Paystack from retrying
    res.status(200).json({ status: "error", message: "Processing failed but acknowledged" });
  }
});

/**
 * Handle successful payment charge (on-ramp: user paid NGN via Paystack).
 * Finds the session by paymentRef and marks it as awaiting_admin_approval.
 */
async function handleChargeSuccess(data) {
  try {
    const paymentRef = data.reference;
    const amountPaid = data.amount / 100; // Convert kobo → NGN
    console.log(`[WEBHOOK] charge.success — ref: ${paymentRef}, amount: ₦${amountPaid}`);

    // Find session by payment reference
    const sessions = await queryDocuments("onRampSessions", "paymentRef", "==", paymentRef);

    if (sessions.length === 0) {
      console.error(`[WEBHOOK] No session found for payment ref: ${paymentRef}`);
      return;
    }

    const session = sessions[0];
    const sessionId = session.id;

    // Skip if already processed
    if (["awaiting_admin_approval", "processing", "completed"].includes(session.status)) {
      console.log(`[WEBHOOK] Session ${sessionId} already processed (status: ${session.status})`);
      return;
    }

    // Verify amount matches
    if (amountPaid !== session.fiatAmount) {
      console.error(`[WEBHOOK] Amount mismatch for session ${sessionId}: expected ₦${session.fiatAmount}, got ₦${amountPaid}`);
      await updateDocument("onRampSessions", sessionId, {
        status: "failed",
        error: `Amount mismatch: expected ₦${session.fiatAmount}, got ₦${amountPaid}`,
        updatedAt: new Date().toISOString(),
      });
      return;
    }

    // Mark as payment confirmed, awaiting admin to approve and send FLOW
    await updateDocument("onRampSessions", sessionId, {
      status: "awaiting_admin_approval",
      paymentConfirmedAt: new Date().toISOString(),
      paymentChannel: data.channel || "paystack",
      paystackPaymentId: data.id,
      updatedAt: new Date().toISOString(),
    });

    console.log(`[WEBHOOK] Session ${sessionId} payment confirmed, awaiting admin approval`);

    // Notify admin
    notifyNewBuyOrder({
      sessionId,
      userEmail: session.userEmail || "unknown",
      fiatAmount: session.fiatAmount,
      estimatedFLOW: session.estimatedFLOW,
      walletAddress: session.walletAddress,
    }).catch((e) => console.error("[NOTIFIER] Buy alert failed:", e.message));

  } catch (error) {
    console.error("[WEBHOOK] Error handling charge.success:", error);
  }
}

/**
 * Handle successful transfer (off-ramp: NGN payout sent to user's bank).
 */
async function handleTransferSuccess(data) {
  try {
    const transferRef = data.reference;
    console.log(`[WEBHOOK] transfer.success — ref: ${transferRef}`);

    const requests = await queryDocuments("offRampRequests", "payoutRef", "==", transferRef);

    if (requests.length === 0) {
      console.error(`[WEBHOOK] No off-ramp request found for transfer ref: ${transferRef}`);
      return;
    }

    const request = requests[0];
    const requestId = request.id;

    if (request.status === "completed") {
      console.log(`[WEBHOOK] Request ${requestId} already completed`);
      return;
    }

    await updateDocument("offRampRequests", requestId, {
      status: "completed",
      ngnSent: (data.amount || 0) / 100,
      payoutConfirmedAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    console.log(`[WEBHOOK] Off-ramp request ${requestId} completed — NGN payout confirmed`);

  } catch (error) {
    console.error("[WEBHOOK] Error handling transfer.success:", error);
  }
}

/**
 * Handle failed/reversed transfer (off-ramp payout failed).
 */
async function handleTransferFailed(data) {
  try {
    const transferRef = data.reference;
    console.log(`[WEBHOOK] transfer.failed — ref: ${transferRef}`);

    const requests = await queryDocuments("offRampRequests", "payoutRef", "==", transferRef);

    if (requests.length === 0) {
      console.error(`[WEBHOOK] No off-ramp request found for transfer ref: ${transferRef}`);
      return;
    }

    const request = requests[0];
    const requestId = request.id;

    await updateDocument("offRampRequests", requestId, {
      status: "payout_failed",
      payoutError: data.message || "Transfer failed",
      failedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    console.log(`[WEBHOOK] Off-ramp request ${requestId} payout failed`);

  } catch (error) {
    console.error("[WEBHOOK] Error handling transfer.failed:", error);
  }
}

module.exports = router;
