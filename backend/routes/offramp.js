const express = require("express");
const router = express.Router();
const { createDocument, getDocument, updateDocument, queryDocuments } = require("../lib/firebase-admin");
const { RateProvider } = require("../lib/rate-provider");
const { ExchangeService } = require("../lib/exchange-service");
const { protect } = require("../lib/auth");

const rateProvider = new RateProvider();
const exchangeService = new ExchangeService();

/**
 * @route   POST /api/offramp/request
 * @desc    Create a new off-ramp request (sell FLOW for NGN).
 *          Returns a Bybit FLOW deposit address for the user to send FLOW to.
 *          The deposit monitor will detect the FLOW arrival and trigger the
 *          automated pipeline: FLOW → USDT (Bybit) → Yellow Card payment → NGN to user's bank.
 * @access  Private
 */
router.post("/request", protect, async (req, res) => {
  try {
    const { uid } = req.user;
    const { walletAddress, amount, payoutDetails } = req.body;

    if (!walletAddress || !amount || !payoutDetails) {
      return res.status(400).json({ error: "Missing required fields: walletAddress, amount, payoutDetails" });
    }

    // Validate payout details for bank transfer
    // networkId is the Yellow Card bank network identifier; bank_code accepted for backward compat
    if (!payoutDetails.account_number || !payoutDetails.account_name) {
      return res.status(400).json({
        error: "payoutDetails must include account_number and account_name",
      });
    }
    if (!payoutDetails.networkId && !payoutDetails.bank_code) {
      return res.status(400).json({
        error: "payoutDetails must include networkId (Yellow Card bank network ID) or bank_code",
      });
    }

    const flowAmount = parseFloat(amount);
    if (isNaN(flowAmount) || flowAmount <= 0) {
      return res.status(400).json({ error: "Invalid FLOW amount" });
    }

    // Calculate live quote: how much NGN the user will receive
    const quote = await rateProvider.calculateSell(flowAmount);

    // Get Bybit FLOW deposit address
    const flowDepositAddress = await exchangeService.getBybitFLOWDepositAddress();

    const offRampRequest = {
      userId: uid,
      walletAddress,
      amount: flowAmount,
      token: "FLOW",
      depositAddress: flowDepositAddress,
      estimatedNGN: quote.netNGN,
      estimatedUSDT: quote.usdtAmount,
      rateSnapshot: {
        flowNGNRate: quote.rates.flowNGNRate,
        usdtNGNRate: quote.rates.usdtNGNRate,
        flowUSDTRate: quote.rates.flowUSDTRate,
      },
      platformFeeNGN: quote.platformFeeNGN,
      payoutDetails,
      status: "awaiting_flow_deposit",
      createdAt: new Date().toISOString(),
    };

    const requestId = await createDocument("offRampRequests", offRampRequest);

    res.json({
      requestId,
      depositAddress: flowDepositAddress,
      quote: {
        flowAmount,
        estimatedNGN: quote.netNGN,
        estimatedUSDT: quote.usdtAmount,
        platformFeeNGN: quote.platformFeeNGN,
        rates: quote.rates,
      },
      instructions: `Send exactly ${flowAmount} FLOW to the deposit address below. Your NGN will be sent to your bank account once the deposit is confirmed (typically 10-15 minutes).`,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    });
  } catch (error) {
    console.error("Create off-ramp request error:", error);
    res.status(500).json({ error: "Failed to create request" });
  }
});

/**
 * @route   GET /api/offramp/requests
 * @desc    Get all off-ramp requests for the authenticated user
 * @access  Private
 */
router.get("/requests", protect, async (req, res) => {
  try {
    const { uid } = req.user;
    const requests = await queryDocuments("offRampRequests", "userId", "==", uid);
    res.json({ requests });
  } catch (error) {
    console.error("Get requests error:", error);
    res.status(500).json({ error: "Failed to get requests" });
  }
});

/**
 * @route   GET /api/offramp/request/:requestId
 * @desc    Get a single off-ramp request by its ID
 * @access  Private
 */
router.get("/request/:requestId", protect, async (req, res) => {
  try {
    const { requestId } = req.params;
    const { uid } = req.user;

    const request = await getDocument("offRampRequests", requestId);

    if (!request) {
      return res.status(404).json({ error: "Request not found" });
    }

    // Ensure the user is authorized to view this request
    if (request.userId !== uid) {
      return res.status(403).json({ error: "Not authorized" });
    }

    res.json(request);
  } catch (error) {
    console.error("Get request error:", error);
    res.status(500).json({ error: "Failed to get request" });
  }
});

module.exports = router;