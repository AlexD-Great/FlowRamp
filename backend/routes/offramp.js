const express = require("express");
const router = express.Router();
const { ForteActionsService } = require("../lib/forte-actions");
const { createDocument, getDocument, updateDocument } = require("../lib/firebase-admin");
const { SERVICE_WALLET } = require("../lib/constants");
const { protect } = require("../lib/auth");

const forte = new ForteActionsService();

const processOffRampPayout = async (requestId) => {
  try {
    const request = await getDocument("offRampRequests", requestId);
    if (!request) return;

    // Update to processing
    await updateDocument("offRampRequests", requestId, { status: "processing" });

    const actionResult = await forte.executeOffRampAction({
      depositor: request.walletAddress,
      amount: request.amount,
      stablecoin: request.stablecoin,
      memo: request.memo,
      requestId: request.id,
    });

    if (actionResult.success) {
      // In a real application, you would initiate the fiat payout here.
      console.log("[v0] Off-Ramp completed:", requestId);
      await updateDocument("offRampRequests", requestId, { status: "completed" });
    } else {
      await updateDocument("offRampRequests", requestId, { status: "failed" });
    }
  } catch (error) {
    console.error("[v0] Process payout error:", error);
    await updateDocument("offRampRequests", requestId, { status: "failed" });
  }
};

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

module.exports = router;
