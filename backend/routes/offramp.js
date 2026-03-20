const express = require("express");
const router = express.Router();
const { createDocument, getDocument, updateDocument, queryDocuments } = require("../lib/firebase-admin");
const { protect } = require("../lib/auth");
const { notifyNewSellOrder } = require("../lib/notifier");
const { PaymentProvider } = require("../lib/payment-provider");

const paymentProvider = new PaymentProvider();

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
 * @route   GET /api/offramp/banks
 * @desc    Get list of Nigerian banks from Paystack for bank selection.
 * @access  Private
 */
router.get("/banks", protect, async (req, res) => {
  try {
    const banks = await paymentProvider.getBankList();
    res.json({ banks });
  } catch (error) {
    console.error("Get bank list error:", error);
    res.status(500).json({ error: "Failed to fetch bank list" });
  }
});

/**
 * @route   POST /api/offramp/resolve-account
 * @desc    Resolve a bank account number to get the account holder name.
 * @access  Private
 */
router.post("/resolve-account", protect, async (req, res) => {
  try {
    const { accountNumber, bankCode } = req.body;

    if (!accountNumber || !bankCode) {
      return res.status(400).json({ error: "accountNumber and bankCode are required" });
    }

    if (accountNumber.length !== 10 || !/^\d+$/.test(accountNumber)) {
      return res.status(400).json({ error: "Account number must be exactly 10 digits" });
    }

    const result = await paymentProvider.resolveAccountNumber(accountNumber, bankCode);
    res.json(result);
  } catch (error) {
    console.error("Resolve account error:", error);
    res.status(400).json({ error: error.message || "Failed to resolve account" });
  }
});

/**
 * @route   POST /api/offramp/request
 * @desc    Create an off-ramp request. User specifies FLOW amount and bank details.
 *          Bank account is verified via Paystack before creating the request.
 *          User then sends FLOW to admin wallet and submits tx hash as proof.
 *          Admin approves → Paystack automatically transfers NGN to user's bank.
 * @access  Private
 */
router.post("/request", protect, async (req, res) => {
  try {
    const { uid } = req.user;
    const { walletAddress, amount, payoutDetails } = req.body;

    if (!walletAddress || !amount || !payoutDetails) {
      return res.status(400).json({ error: "Missing required fields: walletAddress, amount, payoutDetails" });
    }

    if (!payoutDetails.account_number || !payoutDetails.account_name || !payoutDetails.bank_name || !payoutDetails.bank_code) {
      return res.status(400).json({
        error: "payoutDetails must include account_number, account_name, bank_name, and bank_code",
      });
    }

    const flowAmount = parseFloat(amount);
    if (isNaN(flowAmount) || flowAmount < 0.1) {
      return res.status(400).json({ error: "Minimum sell amount is 0.1 FLOW" });
    }

    const flowRate = getFlowRate();
    const estimatedNGN = parseFloat((flowAmount * flowRate).toFixed(2));

    // Pre-create a Paystack transfer recipient so payout is ready on approval
    let recipientCode = null;
    try {
      const recipient = await paymentProvider.createTransferRecipient({
        accountName: payoutDetails.account_name,
        accountNumber: payoutDetails.account_number,
        bankCode: payoutDetails.bank_code,
      });
      recipientCode = recipient.recipientCode;
    } catch (err) {
      console.warn("[OFFRAMP] Could not pre-create transfer recipient:", err.message);
      // Non-blocking: admin can still manually process if recipient creation fails
    }

    const offRampRequest = {
      userId: uid,
      walletAddress,
      amount: flowAmount,
      token: "FLOW",
      adminFlowAddress: ADMIN_FLOW_ADDRESS,
      estimatedNGN,
      flowNGNRate: flowRate,
      payoutDetails,
      paystackRecipientCode: recipientCode,
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
      instructions: `Send exactly ${flowAmount} FLOW to the address below from your connected wallet, then submit your transaction hash. Your ₦${estimatedNGN.toLocaleString()} will be sent automatically to your bank after admin confirmation.`,
    });
  } catch (error) {
    console.error("Create off-ramp request error:", error);
    res.status(500).json({ error: "Failed to create request" });
  }
});

/**
 * @route   POST /api/offramp/submit-proof/:requestId
 * @desc    User submits FLOW transaction proof (tx hash) after sending FLOW.
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

    res.json({ message: "Proof submitted successfully. Admin will verify and your NGN will be sent automatically.", requestId });
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
