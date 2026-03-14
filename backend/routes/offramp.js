const express = require("express");
const router = express.Router();
const { createDocument, getDocument, updateDocument, queryDocuments } = require("../lib/firebase-admin");
const { protect } = require("../lib/auth");
const { notifyNewSellOrder } = require("../lib/notifier");

// Admin FLOW wallet address — users send FLOW here to initiate sell
const ADMIN_FLOW_ADDRESS = process.env.ADMIN_FLOW_ADDRESS || process.env.FLOW_ACCOUNT_ADDRESS || "0x0000000000000000";

// FLOW rate (NGN per 1 FLOW)
const getFlowRate = () => parseFloat(process.env.FLOW_NGN_RATE || "2000");

/**
 * @route   GET /api/offramp/deposit-address
 * @desc    Get the admin FLOW wallet address for users to send FLOW to.
 * @access  Private
 */
router.get("/deposit-address", protect, async (req, res) => {
  try {
    res.json({
      flowAddress: ADMIN_FLOW_ADDRESS,
      flowNGNRate: getFlowRate(),
    });
  } catch (error) {
    console.error("Get deposit address error:", error);
    res.status(500).json({ error: "Failed to get deposit address" });
  }
});

/**
 * @route   POST /api/offramp/request
 * @desc    Create a manual off-ramp request. User specifies FLOW amount and
 *          their receiving bank account. Admin FLOW wallet address is returned
 *          for user to send FLOW to, then user uploads proof.
 *          Admin reviews and manually sends NGN to user's bank account.
 * @access  Private
 */
router.post("/request", protect, async (req, res) => {
  try {
    const { uid } = req.user;
    const { walletAddress, amount, payoutDetails } = req.body;

    if (!walletAddress || !amount || !payoutDetails) {
      return res.status(400).json({ error: "Missing required fields: walletAddress, amount, payoutDetails" });
    }

    if (!payoutDetails.account_number || !payoutDetails.account_name || !payoutDetails.bank_name) {
      return res.status(400).json({
        error: "payoutDetails must include account_number, account_name, and bank_name",
      });
    }

    const flowAmount = parseFloat(amount);
    if (isNaN(flowAmount) || flowAmount < 0.1) {
      return res.status(400).json({ error: "Minimum sell amount is 0.1 FLOW" });
    }

    const flowRate = getFlowRate();
    const estimatedNGN = parseFloat((flowAmount * flowRate).toFixed(2));

    const offRampRequest = {
      userId: uid,
      walletAddress,
      amount: flowAmount,
      token: "FLOW",
      adminFlowAddress: ADMIN_FLOW_ADDRESS,
      estimatedNGN,
      flowNGNRate: flowRate,
      payoutDetails,
      status: "awaiting_flow_deposit",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const requestId = await createDocument("offRampRequests", offRampRequest);

    res.json({
      requestId,
      adminFlowAddress: ADMIN_FLOW_ADDRESS,
      estimatedNGN,
      flowNGNRate: flowRate,
      flowAmount,
      instructions: `Send exactly ${flowAmount} FLOW to the address below from your connected wallet, then upload your transaction proof. Your NGN will be sent to your bank account after admin confirmation.`,
    });
  } catch (error) {
    console.error("Create off-ramp request error:", error);
    res.status(500).json({ error: "Failed to create request" });
  }
});

/**
 * @route   POST /api/offramp/submit-proof/:requestId
 * @desc    User submits FLOW transaction proof after sending FLOW to admin wallet.
 *          Sets status to awaiting_admin_approval.
 * @access  Private
 */
router.post("/submit-proof/:requestId", protect, async (req, res) => {
  try {
    const { requestId } = req.params;
    const { uid } = req.user;
    const { proofUrl, txHash, proofNote } = req.body;

    if (!proofUrl && !txHash) {
      return res.status(400).json({ error: "Must provide proofUrl or txHash" });
    }

    const request = await getDocument("offRampRequests", requestId);

    if (!request) {
      return res.status(404).json({ error: "Request not found" });
    }

    if (request.userId !== uid) {
      return res.status(403).json({ error: "Not authorized" });
    }

    if (!["awaiting_flow_deposit", "proof_rejected"].includes(request.status)) {
      return res.status(400).json({ error: `Cannot submit proof for request in status: ${request.status}` });
    }

    await updateDocument("offRampRequests", requestId, {
      status: "awaiting_admin_approval",
      proofUrl: proofUrl || null,
      txHash: txHash || null,
      proofNote: proofNote || "",
      proofSubmittedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // Fire-and-forget admin notification
    notifyNewSellOrder({
      requestId,
      userEmail: request.userEmail || req.user.email || "unknown",
      flowAmount: request.amount,
      estimatedNGN: request.estimatedNGN,
      bankDetails: request.payoutDetails || null,
    }).catch((e) => console.error("[NOTIFIER] Sell alert failed:", e.message));

    res.json({ message: "Proof submitted successfully. Admin will review and process your NGN payout.", requestId });
  } catch (error) {
    console.error("Submit proof error:", error);
    res.status(500).json({ error: "Failed to submit proof" });
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