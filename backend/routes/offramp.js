const express = require("express");
const router = express.Router();
const fs = require("fs");
const path = require("path");
const { ForteActionsService } = require("../lib/forte-actions");
const { createDocument, getDocument, updateDocument, queryDocuments } = require("../lib/firebase-admin");
const { SERVICE_WALLET } = require("../lib/constants");
const { protect } = require("../lib/auth");
const { t } = require("../lib/flow-client");

const forte = new ForteActionsService();

router.post("/request", protect, async (req, res) => {
  try {
    const { uid } = req.user;
    const { walletAddress, amount, token, payoutMethod, payoutDetails } = req.body;

    // Support both 'stablecoin' (legacy) and 'token' (new) parameter names
    const tokenType = token || req.body.stablecoin;

    if (!walletAddress || !amount || !tokenType || !payoutMethod || !payoutDetails) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Validate token type
    const validTokens = ["FUSD", "fUSDC", "fUSDT", "FLOW"];
    if (!validTokens.includes(tokenType)) {
      return res.status(400).json({ error: "Invalid token type. Supported: " + validTokens.join(", ") });
    }

    const memo = `OFF-RAMP-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

    const offRampRequest = {
      userId: uid,
      walletAddress,
      amount,
      token: tokenType,
      stablecoin: tokenType, // Keep for backward compatibility
      deposit_address: SERVICE_WALLET.ADDRESS,
      memo,
      status: "pending",
      payoutMethod,
      payoutDetails,
      createdAt: new Date().toISOString(),
    };

    const requestId = await createDocument("offRampRequests", offRampRequest);

    res.json({
      requestId,
      depositAddress: SERVICE_WALLET.ADDRESS,
      memo,
      token: tokenType,
    });
  } catch (error) {
    console.error("Create off-ramp request error:", error);
    res.status(500).json({ error: "Failed to create request" });
  }
});

router.post("/initiate", protect, async (req, res) => {
  try {
    const { requestId } = req.body;
    const request = await getDocument("offRampRequests", requestId);

    if (!request) {
      return res.status(404).json({ error: "Request not found" });
    }

    // Determine which transaction to use based on token type
    const tokenType = request.token || request.stablecoin;
    let cadencePath;
    let args;

    if (tokenType === "FLOW") {
      // FLOW token off-ramp transaction
      cadencePath = path.join(__dirname, "../cadence/transactions/flowOffRamp.cdc");
      args = [
        { type: "UFix64", value: request.amount.toFixed(8) },
        { type: "String", value: request.memo },
        { type: "String", value: requestId },
        { type: "Address", value: SERVICE_WALLET.ADDRESS },
      ];
    } else {
      // Stablecoin off-ramp transaction (FUSD, fUSDC, fUSDT)
      cadencePath = path.join(__dirname, "../cadence/forte/execute_off_ramp_with_actions.cdc");
      args = [
        { type: "UFix64", value: request.amount.toFixed(8) },
        { type: "String", value: request.memo },
        { type: "String", value: requestId },
      ];
    }

    const cadence = fs.readFileSync(cadencePath, "utf8");

    res.json({
      cadence,
      args,
      tokenType,
    });
  } catch (error) {
    console.error("Initiate off-ramp error:", error);
    res.status(500).json({ error: "Failed to initiate off-ramp" });
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