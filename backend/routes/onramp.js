const express = require("express");
const router = express.Router();
const { createDocument, getDocument, updateDocument, queryDocuments, getUserById } = require("../lib/firebase-admin");
const { RateProvider } = require("../lib/rate-provider");
const { ExchangeService } = require("../lib/exchange-service");
const { protect } = require("../lib/auth");

const rateProvider = new RateProvider();
const exchangeService = new ExchangeService();

/**
 * @route   POST /api/onramp/create-session
 * @desc    Create a new on-ramp session (buy FLOW with NGN).
 *          Creates a Yellow Card collection — returns bank account details
 *          for the user to transfer NGN to. When Yellow Card confirms the
 *          collection (via webhook), the buy pipeline auto-executes:
 *          USD float → buy FLOW on Bybit → withdraw FLOW to user wallet.
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

    // Get user email
    let userEmail = email;
    if (!userEmail) {
      const userRecord = await getUserById(uid);
      userEmail = userRecord?.email || "customer@example.com";
    }

    // Calculate live quote: how much FLOW the user will receive
    const quote = await rateProvider.calculateBuy(ngnAmount);

    // Create the Firestore session first so we have an ID for the YC sequenceId
    const session = {
      userId: uid,
      userEmail,
      walletAddress,
      fiatAmount: ngnAmount,
      fiatCurrency: "NGN",
      token: "FLOW",
      estimatedFLOW: quote.flowAmount,
      estimatedUSDT: quote.usdtAmount,
      rateSnapshot: {
        flowNGNRate: quote.rates.flowNGNRate,
        usdtNGNRate: quote.rates.usdtNGNRate,
        flowUSDTRate: quote.rates.flowUSDTRate,
      },
      platformFeeNGN: quote.platformFeeNGN,
      status: "awaiting_ngn_deposit",
      createdAt: new Date().toISOString(),
    };

    const sessionId = await createDocument("onRampSessions", session);

    // Create Yellow Card collection — returns bank details for user to pay into
    const ycCollection = await exchangeService.createNGNCollection(sessionId, ngnAmount);

    // Store the YC collection ID on the session
    await updateDocument("onRampSessions", sessionId, {
      ycCollectionId: ycCollection.id,
      status: "collection_pending",
      updatedAt: new Date().toISOString(),
    });

    res.json({
      sessionId,
      collection: {
        id: ycCollection.id,
        status: ycCollection.status,
        bankDetails: ycCollection.destination || ycCollection.bankAccount || null,
        instructions: `Transfer exactly ₦${ngnAmount.toLocaleString()} to the bank account below. Your FLOW tokens will be sent to ${walletAddress} once the payment is confirmed (typically 5-15 minutes).`,
      },
      quote: {
        ngnAmount,
        estimatedFLOW: quote.flowAmount,
        estimatedUSDT: quote.usdtAmount,
        platformFeeNGN: quote.platformFeeNGN,
        rates: quote.rates,
      },
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
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
