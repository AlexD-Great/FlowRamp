const express = require("express");
const router = express.Router();
const { PaymentProvider } = require("../lib/payment-provider");
const { ForteActionsService } = require("../lib/forte-actions");
const { createDocument, getDocument, queryDocuments } = require("../lib/firebase-admin");
const { calculateOnRampTotal } = require("../lib/conversions"); // We will create this file next
const { protect } = require("../lib/auth");

const paymentProvider = new PaymentProvider();
const forte = new ForteActionsService();

router.post("/create-session", protect, async (req, res) => {
  try {
    // Associate the session with the authenticated user
    const { uid } = req.user;
    const { walletAddress, fiatCurrency, fiatAmount, preferredStablecoin = "FUSD" } = req.body;

    if (!walletAddress || !fiatCurrency || !fiatAmount) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const calculation = calculateOnRampTotal(fiatAmount, fiatCurrency);

    const paymentIntent = await paymentProvider.createPaymentIntent(fiatAmount, fiatCurrency, {
      walletAddress,
      stablecoin: preferredStablecoin,
    });

    const session = {
      userId: uid, // Link session to user
      walletAddress,
      fiatAmount,
      fiatCurrency,
      usdAmount: calculation.finalAmount,
      stablecoin: preferredStablecoin,
      paymentRef: paymentIntent.paymentRef,
      paymentProviderRef: paymentIntent.providerRef,
      status: "created",
      createdAt: new Date().toISOString(),
    };

    const sessionId = await createDocument("onRampSessions", session);

    res.json({
      sessionId,
      paymentUrl: paymentIntent.paymentUrl,
      paymentRef: paymentIntent.paymentRef,
      expiresAt: paymentIntent.expiresAt.toISOString(),
    });
  } catch (error) {
    console.error("Create session error:", error);
    res.status(500).json({ error: "Failed to create session" });
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

        // Ensure the user is authorized to view this session
        if (session.userId !== uid) {
            return res.status(403).json({ error: "Not authorized" });
        }

        res.json(session);
    } catch (error) {
        console.error("Get session error:", error);
        res.status(500).json({ error: "Failed to get session" });
    }
});

module.exports = router;
