const express = require("express");
const router = express.Router();
const fs = require("fs");
const path = require("path");
const { ForteActionsService } = require("../lib/forte-actions");
const { createDocument, getDocument, updateDocument } = require("../lib/firebase-admin");
const { SERVICE_WALLET } = require("../lib/constants");
const { protect } = require("../lib/auth");
const { t } = require("../lib/flow-client");

const forte = new ForteActionsService();

router.post("/request", protect, async (req, res) => {
  try {
    const { walletAddress, amount, stablecoin, payoutMethod, payoutDetails } = req.body;

    if (!walletAddress || !amount || !stablecoin || !payoutMethod || !payoutDetails) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const memo = `OFF-RAMP-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

    const offRampRequest = {
      walletAddress,
      amount,
      stablecoin,
      deposit_address: SERVICE_WALLET.ADDRESS,
      memo,
      status: "pending",
      payoutDetails,
    };

    const requestId = await createDocument("offRampRequests", offRampRequest);

    res.json({
      requestId,
      depositAddress: SERVICE_WALLET.ADDRESS,
      memo,
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

    const cadence = fs.readFileSync(path.join(__dirname, "../cadence/forte/execute_off_ramp_with_actions.cdc"), "utf8");
    const args = [
      { type: "UFix64", value: request.amount.toFixed(8) },
      { type: "String", value: request.memo },
      { type: "String", value: requestId },
    ];

    res.json({
      cadence,
      args,
    });
  } catch (error) {
    console.error("Initiate off-ramp error:", error);
    res.status(500).json({ error: "Failed to initiate off-ramp" });
  }
});

module.exports = router;