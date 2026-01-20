const express = require("express");
const router = express.Router();
const { PaymentProvider } = require("../lib/payment-provider");
const { processPayment } = require("../lib/payment-processor");
const { updateDocument, queryDocuments } = require("../lib/firebase-admin");
const { notificationService } = require("../lib/notifications");

const paymentProvider = new PaymentProvider();

/**
 * @route   POST /api/webhook/paystack
 * @desc    Handle Paystack webhook events (payment confirmations)
 * @access  Public (but verified with signature)
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
    const isValid = paymentProvider.verifyWebhookSignature(signature, JSON.parse(payload));

    if (!isValid) {
      console.error("[WEBHOOK] Invalid Paystack signature");
      return res.status(401).json({ error: "Invalid signature" });
    }

    const event = JSON.parse(payload);
    console.log("[WEBHOOK] Received event:", event.event);

    // Handle different event types
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

      default:
        console.log(`[WEBHOOK] Unhandled event type: ${event.event}`);
    }

    // Always respond with 200 to acknowledge receipt
    res.status(200).json({ status: "success" });
  } catch (error) {
    console.error("[WEBHOOK] Error processing webhook:", error);
    res.status(500).json({ error: "Webhook processing failed" });
  }
});

/**
 * Handle successful payment charges (on-ramp)
 */
async function handleChargeSuccess(data) {
  try {
    const paymentRef = data.reference;
    console.log(`[WEBHOOK] Processing charge success for reference: ${paymentRef}`);

    // Find the session associated with this payment
    const sessions = await queryDocuments("onRampSessions", "paymentRef", "==", paymentRef);

    if (sessions.length === 0) {
      console.error(`[WEBHOOK] No session found for payment reference: ${paymentRef}`);
      return;
    }

    const session = sessions[0];
    const sessionId = session.id;

    // Check if payment amount matches
    const expectedAmount = session.fiatAmount * 100; // Convert to kobo
    if (data.amount !== expectedAmount) {
      console.error(`[WEBHOOK] Amount mismatch. Expected: ${expectedAmount}, Got: ${data.amount}`);
      await updateDocument("onRampSessions", sessionId, {
        status: "failed",
        error: "Amount mismatch",
        updatedAt: new Date().toISOString(),
      });
      return;
    }

    // Update session to awaiting admin approval status
    await updateDocument("onRampSessions", sessionId, {
      status: "awaiting_admin_approval",
      paymentConfirmedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    console.log(`[WEBHOOK] Session ${sessionId} marked as paid, awaiting admin approval`);

    // Send notification to admins
    await notificationService.notifyPendingOnramp(session);

  } catch (error) {
    console.error("[WEBHOOK] Error handling charge success:", error);
  }
}

/**
 * Handle successful transfer (off-ramp payout)
 */
async function handleTransferSuccess(data) {
  try {
    const transferRef = data.reference;
    console.log(`[WEBHOOK] Processing transfer success for reference: ${transferRef}`);

    // Find the off-ramp request associated with this transfer
    const requests = await queryDocuments("offRampRequests", "payoutRef", "==", transferRef);

    if (requests.length === 0) {
      console.error(`[WEBHOOK] No off-ramp request found for transfer reference: ${transferRef}`);
      return;
    }

    const request = requests[0];
    const requestId = request.id;

    // Update request to completed status
    await updateDocument("offRampRequests", requestId, {
      status: "completed",
      completedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    console.log(`[WEBHOOK] Off-ramp request ${requestId} marked as completed`);

  } catch (error) {
    console.error("[WEBHOOK] Error handling transfer success:", error);
  }
}

/**
 * Handle failed transfer (off-ramp payout)
 */
async function handleTransferFailed(data) {
  try {
    const transferRef = data.reference;
    console.log(`[WEBHOOK] Processing transfer failure for reference: ${transferRef}`);

    // Find the off-ramp request associated with this transfer
    const requests = await queryDocuments("offRampRequests", "payoutRef", "==", transferRef);

    if (requests.length === 0) {
      console.error(`[WEBHOOK] No off-ramp request found for transfer reference: ${transferRef}`);
      return;
    }

    const request = requests[0];
    const requestId = request.id;

    // Update request to failed status
    await updateDocument("offRampRequests", requestId, {
      status: "failed",
      error: data.message || "Transfer failed",
      failedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    console.log(`[WEBHOOK] Off-ramp request ${requestId} marked as failed`);

  } catch (error) {
    console.error("[WEBHOOK] Error handling transfer failure:", error);
  }
}

module.exports = router;
