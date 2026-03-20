const express = require("express");
const router = express.Router();
const fs = require("fs");
const path = require("path");
const { createDocument, getDocument, updateDocument, queryDocuments, getUserById } = require("../lib/firebase-admin");
const { protect } = require("../lib/auth");
const { executeScript, t } = require("../lib/flow-client");
const { notifyNewBuyOrder } = require("../lib/notifier");
const { PaymentProvider } = require("../lib/payment-provider");

const paymentProvider = new PaymentProvider();

// FLOW rate (NGN per 1 FLOW) — set via environment variable or fallback
const getFlowRate = () => parseFloat(process.env.FLOW_NGN_RATE || "2000");

/**
 * @route   POST /api/onramp/create-session
 * @desc    Create an on-ramp session and initialize a Paystack payment.
 *          Returns a Paystack authorization URL for the user to pay NGN.
 *          After payment, Paystack webhook confirms and admin sends FLOW.
 * @access  Private
 */
router.post("/create-session", protect, async (req, res) => {
  try {
    const { uid, email } = req.user;
    const { walletAddress, fiatAmount } = req.body;

    if (!walletAddress || !fiatAmount) {
      return res.status(400).json({ error: "Missing required fields: walletAddress, fiatAmount" });
    }

    const ngnAmount = parseFloat(fiatAmount);
    if (isNaN(ngnAmount) || ngnAmount < 1000) {
      return res.status(400).json({ error: "Minimum amount is ₦1,000" });
    }
    if (ngnAmount > 5000000) {
      return res.status(400).json({ error: "Maximum amount is ₦5,000,000" });
    }

    let userEmail = email;
    if (!userEmail) {
      const userRecord = await getUserById(uid);
      userEmail = userRecord?.email || "unknown@example.com";
    }

    const flowRate = getFlowRate();
    const estimatedFLOW = parseFloat((ngnAmount / flowRate).toFixed(4));

    // Initialize Paystack transaction
    const callbackUrl = process.env.PAYSTACK_CALLBACK_URL || `${process.env.FRONTEND_URL || process.env.CORS_ORIGIN || "http://localhost:3000"}/buy?status=callback`;

    const paystackResult = await paymentProvider.initializeTransaction({
      amount: ngnAmount,
      email: userEmail,
      metadata: {
        userId: uid,
        walletAddress,
        estimatedFLOW,
        flowNGNRate: flowRate,
        type: "onramp",
      },
      callbackUrl,
    });

    const session = {
      userId: uid,
      userEmail,
      walletAddress,
      fiatAmount: ngnAmount,
      fiatCurrency: "NGN",
      token: "FLOW",
      estimatedFLOW,
      flowNGNRate: flowRate,
      status: "awaiting_payment",
      paymentRef: paystackResult.reference,
      paystackAccessCode: paystackResult.accessCode,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const sessionId = await createDocument("onRampSessions", session);

    res.json({
      sessionId,
      authorizationUrl: paystackResult.authorizationUrl,
      accessCode: paystackResult.accessCode,
      paymentRef: paystackResult.reference,
      estimatedFLOW,
      flowNGNRate: flowRate,
      ngnAmount,
    });
  } catch (error) {
    console.error("Create session error:", error);
    res.status(500).json({ error: error.message || "Failed to create session" });
  }
});

/**
 * @route   GET /api/onramp/verify-payment/:sessionId
 * @desc    Verify payment status for a session (called after Paystack redirect).
 *          If payment is confirmed, status moves to awaiting_admin_approval.
 * @access  Private
 */
router.get("/verify-payment/:sessionId", protect, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { uid } = req.user;

    const session = await getDocument("onRampSessions", sessionId);
    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }
    if (session.userId !== uid) {
      return res.status(403).json({ error: "Not authorized" });
    }

    // If already confirmed, just return current status
    if (["awaiting_admin_approval", "processing", "completed"].includes(session.status)) {
      return res.json({ status: session.status, message: "Payment already confirmed." });
    }

    if (!session.paymentRef) {
      return res.status(400).json({ error: "No payment reference found for this session." });
    }

    // Verify with Paystack
    const verification = await paymentProvider.verifyTransaction(session.paymentRef);

    if (verification.status === "success") {
      // Verify amount matches
      if (verification.amount !== session.fiatAmount) {
        await updateDocument("onRampSessions", sessionId, {
          status: "failed",
          error: `Amount mismatch: expected ₦${session.fiatAmount}, got ₦${verification.amount}`,
          updatedAt: new Date().toISOString(),
        });
        return res.status(400).json({ error: "Payment amount does not match the session amount." });
      }

      await updateDocument("onRampSessions", sessionId, {
        status: "awaiting_admin_approval",
        paymentConfirmedAt: new Date().toISOString(),
        paymentChannel: verification.channel,
        updatedAt: new Date().toISOString(),
      });

      // Notify admin
      notifyNewBuyOrder({
        sessionId,
        userEmail: session.userEmail,
        fiatAmount: session.fiatAmount,
        estimatedFLOW: session.estimatedFLOW,
        walletAddress: session.walletAddress,
      }).catch((e) => console.error("[NOTIFIER] Buy alert failed:", e.message));

      return res.json({ status: "awaiting_admin_approval", message: "Payment confirmed! Admin will review and send your FLOW." });
    }

    res.json({ status: session.status, paymentStatus: verification.status, message: "Payment not yet confirmed." });
  } catch (error) {
    console.error("Verify payment error:", error);
    res.status(500).json({ error: "Failed to verify payment" });
  }
});

/**
 * @route   GET /api/onramp/sessions
 * @desc    Get all on-ramp sessions for the authenticated user.
 * @access  Private
 */
router.get("/sessions", protect, async (req, res) => {
  try {
    const { uid } = req.user;
    const sessions = await queryDocuments("onRampSessions", "userId", "==", uid);
    sessions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json({ sessions });
  } catch (error) {
    console.error("Get sessions error:", error);
    res.status(500).json({ error: "Failed to get sessions" });
  }
});

/**
 * @route   GET /api/onramp/session/:sessionId
 * @desc    Get a single on-ramp session by its ID.
 * @access  Private
 */
router.get("/session/:sessionId", protect, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { uid } = req.user;

    const session = await getDocument("onRampSessions", sessionId);

    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }

    if (session.userId !== uid) {
      return res.status(403).json({ error: "Not authorized" });
    }

    res.json(session);
  } catch (error) {
    console.error("Get session error:", error);
    res.status(500).json({ error: "Failed to get session" });
  }
});

/**
 * @route   GET /api/onramp/check-vault/:address
 * @desc    Checks if a Flow wallet address has a FLOW token vault set up.
 * @access  Private
 */
router.get("/check-vault/:address", protect, async (req, res) => {
  try {
    const { address } = req.params;
    if (!address || !address.startsWith("0x")) {
      return res.status(400).json({ error: "Invalid Flow address" });
    }

    const cadence = fs.readFileSync(
      path.join(__dirname, "../cadence/scripts/hasVault.cdc"),
      "utf8"
    );

    const result = await executeScript(cadence, [
      [address, t.Address],
      [{ domain: "public", identifier: "flowTokenBalance" }, t.Path],
    ]);

    res.json({ address, hasVault: !!result });
  } catch (error) {
    console.error("[ONRAMP] check-vault error:", error);
    res.json({ address: req.params.address, hasVault: true, warning: "Could not verify vault status" });
  }
});

module.exports = router;
