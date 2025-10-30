const express = require("express");
const router = express.Router();
const { PaymentProvider } = require("../lib/payment-provider");
const { ForteActionsService } = require("../lib/forte-actions");
const { createDocument, getDocument, queryDocuments, getUserById } = require("../lib/firebase-admin");
const { calculateOnRampTotal } = require("../lib/conversions");
const { protect } = require("../lib/auth");
const { asyncHandler, ValidationError, NotFoundError, AuthorizationError } = require("../lib/error-handler");
const { strictLimiter } = require("../lib/rate-limiter");
const { TransactionTracker } = require("../lib/transaction-tracker");

const paymentProvider = new PaymentProvider();
const forte = new ForteActionsService();
const txTracker = new TransactionTracker();

router.post("/create-session", protect, strictLimiter, asyncHandler(async (req, res) => {
  // Associate the session with the authenticated user
  const { uid, email } = req.user;
  const { walletAddress, fiatCurrency, fiatAmount, preferredStablecoin = "FUSD" } = req.body;

  // Validation
  if (!walletAddress || !fiatCurrency || !fiatAmount) {
    throw new ValidationError("Missing required fields: walletAddress, fiatCurrency, fiatAmount");
  }

  if (fiatAmount <= 0) {
    throw new ValidationError("Fiat amount must be greater than 0");
  }

  if (!walletAddress.startsWith("0x") || walletAddress.length !== 18) {
    throw new ValidationError("Invalid Flow wallet address format");
  }

  // Get user email if not in token
  let userEmail = email;
  if (!userEmail) {
    const userRecord = await getUserById(uid);
    userEmail = userRecord?.email || "customer@example.com";
  }

  const calculation = calculateOnRampTotal(fiatAmount, fiatCurrency);

  const paymentIntent = await paymentProvider.createPaymentIntent(
    fiatAmount, 
    fiatCurrency, 
    {
      walletAddress,
      stablecoin: preferredStablecoin,
      userId: uid,
    },
    userEmail
  );

  const session = {
    userId: uid,
    userEmail,
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

  console.log(`✅ On-ramp session created: ${sessionId} for user ${uid}`);

  res.json({
    success: true,
    sessionId,
    paymentUrl: paymentIntent.paymentUrl,
    paymentRef: paymentIntent.paymentRef,
    expiresAt: paymentIntent.expiresAt.toISOString(),
  });
}));

/**
 * @route   GET /api/onramp/sessions
 * @desc    Get all on-ramp sessions for the authenticated user.
 * @access  Private
 */
router.get("/sessions", protect, asyncHandler(async (req, res) => {
  const { uid } = req.user;
  const sessions = await queryDocuments("onRampSessions", "userId", "==", uid);
  
  res.json({ 
    success: true,
    count: sessions.length,
    sessions 
  });
}));

/**
 * @route   GET /api/onramp/session/:sessionId
 * @desc    Get a single on-ramp session by its ID.
 * @access  Private
 */
router.get("/session/:sessionId", protect, asyncHandler(async (req, res) => {
  const { sessionId } = req.params;
  const { uid } = req.user;

  const session = await getDocument("onRampSessions", sessionId);

  if (!session) {
    throw new NotFoundError("Session");
  }

  // Ensure the user is authorized to view this session
  if (session.userId !== uid) {
    throw new AuthorizationError("You are not authorized to view this session");
  }

  res.json({
    success: true,
    session
  });
}));

module.exports = router;
