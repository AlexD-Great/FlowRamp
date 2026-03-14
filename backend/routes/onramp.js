const express = require("express");
const router = express.Router();
const fs = require("fs");
const path = require("path");
const { createDocument, getDocument, updateDocument, queryDocuments, getUserById } = require("../lib/firebase-admin");
const { protect } = require("../lib/auth");
const { executeScript, t } = require("../lib/flow-client");
const { notifyNewBuyOrder } = require("../lib/notifier");

// Admin bank account details — set via environment variables
const ADMIN_BANK_DETAILS = {
  accountName: process.env.ADMIN_BANK_ACCOUNT_NAME || "FlowRamp Operations",
  accountNumber: process.env.ADMIN_BANK_ACCOUNT_NUMBER || "0000000000",
  bankName: process.env.ADMIN_BANK_NAME || "Access Bank",
  bankCode: process.env.ADMIN_BANK_CODE || "044",
};

// FLOW rate (NGN per 1 FLOW) — set via environment variable or fallback
const getFlowRate = () => parseFloat(process.env.FLOW_NGN_RATE || "2000");

/**
 * @route   POST /api/onramp/create-session
 * @desc    Create a manual on-ramp session. Returns admin bank details for
 *          the user to manually transfer NGN. User then uploads proof.
 *          Admin reviews proof and manually deposits FLOW to user wallet.
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

    const session = {
      userId: uid,
      userEmail,
      walletAddress,
      fiatAmount: ngnAmount,
      fiatCurrency: "NGN",
      token: "FLOW",
      estimatedFLOW,
      flowNGNRate: flowRate,
      status: "awaiting_ngn_deposit",
      adminBankDetails: ADMIN_BANK_DETAILS,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const sessionId = await createDocument("onRampSessions", session);

    res.json({
      sessionId,
      bankDetails: ADMIN_BANK_DETAILS,
      estimatedFLOW,
      flowNGNRate: flowRate,
      ngnAmount,
      instructions: `Transfer exactly ₦${ngnAmount.toLocaleString()} to the account below, then upload your payment proof. Your FLOW tokens will be sent to ${walletAddress} after admin confirmation.`,
    });
  } catch (error) {
    console.error("Create session error:", error);
    res.status(500).json({ error: "Failed to create session" });
  }
});

/**
 * @route   GET /api/onramp/bank-details
 * @desc    Get the admin bank account details for NGN deposits.
 * @access  Private
 */
router.get("/bank-details", protect, async (req, res) => {
  try {
    const flowRate = getFlowRate();
    res.json({
      bankDetails: ADMIN_BANK_DETAILS,
      flowNGNRate: flowRate,
    });
  } catch (error) {
    console.error("Get bank details error:", error);
    res.status(500).json({ error: "Failed to get bank details" });
  }
});

/**
 * @route   POST /api/onramp/submit-proof/:sessionId
 * @desc    User submits payment proof (base64 image URL or cloud URL) after
 *          transferring NGN. Sets status to awaiting_admin_approval.
 * @access  Private
 */
router.post("/submit-proof/:sessionId", protect, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { uid } = req.user;
    const { proofUrl, proofNote } = req.body;

    if (!proofUrl) {
      return res.status(400).json({ error: "Missing proofUrl" });
    }

    const session = await getDocument("onRampSessions", sessionId);

    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }

    if (session.userId !== uid) {
      return res.status(403).json({ error: "Not authorized" });
    }

    if (!["awaiting_ngn_deposit", "proof_rejected"].includes(session.status)) {
      return res.status(400).json({ error: `Cannot submit proof for session in status: ${session.status}` });
    }

    await updateDocument("onRampSessions", sessionId, {
      status: "awaiting_admin_approval",
      proofUrl,
      proofNote: proofNote || "",
      proofSubmittedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // Fire-and-forget admin notification
    notifyNewBuyOrder({
      sessionId,
      userEmail: session.userEmail || req.user.email || "unknown",
      fiatAmount: session.fiatAmount,
      estimatedFLOW: session.estimatedFLOW,
      walletAddress: session.walletAddress,
    }).catch((e) => console.error("[NOTIFIER] Buy alert failed:", e.message));

    res.json({ message: "Proof submitted successfully. Admin will review and process your request.", sessionId });
  } catch (error) {
    console.error("Submit proof error:", error);
    res.status(500).json({ error: "Failed to submit proof" });
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
 *          Uses the hasVault.cdc script on-chain. Returns { hasVault: bool }.
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

    // /public/flowTokenBalance is the standard public balance path for FLOW
    const result = await executeScript(cadence, [
      [address, t.Address],
      [{ domain: "public", identifier: "flowTokenBalance" }, t.Path],
    ]);

    res.json({ address, hasVault: !!result });
  } catch (error) {
    console.error("[ONRAMP] check-vault error:", error);
    // If script execution fails, assume vault exists to avoid blocking users
    res.json({ address: req.params.address, hasVault: true, warning: "Could not verify vault status" });
  }
});

module.exports = router;
