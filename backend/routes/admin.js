const express = require("express");
const fs = require("fs");
const path = require("path");

const router = express.Router();
const { protect, adminOnly } = require("../lib/auth");
const {
  getDocument,
  updateDocument,
  queryDocuments,
  getUserById,
  db,
} = require("../lib/firebase-admin");
const { getServiceWalletBalance, sendTransaction, getTransactionStatus, t } = require("../lib/flow-client");

router.get("/onramp/sessions", adminOnly, async (req, res) => {
  try {
    const snapshot = await db.collection("onRampSessions").get();
    const sessions = snapshot.docs
      .map((doc) => ({ id: doc.id, ...doc.data() }))
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

    res.json({ sessions });
  } catch (error) {
    console.error("[ADMIN] Error fetching all onramp sessions:", error);
    res.status(500).json({ error: "Failed to fetch onramp sessions" });
  }
});

router.get("/offramp/requests", adminOnly, async (req, res) => {
  try {
    const snapshot = await db.collection("offRampRequests").get();
    const requests = snapshot.docs
      .map((doc) => ({ id: doc.id, ...doc.data() }))
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

    res.json({ requests });
  } catch (error) {
    console.error("[ADMIN] Error fetching all offramp requests:", error);
    res.status(500).json({ error: "Failed to fetch offramp requests" });
  }
});

router.post("/onramp/reopen/:sessionId", adminOnly, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const session = await getDocument("onRampSessions", sessionId);

    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }

    await updateDocument("onRampSessions", sessionId, {
      status: "awaiting_ngn_deposit",
      reopenedAt: new Date().toISOString(),
      reopenedBy: req.user.uid,
      updatedAt: new Date().toISOString(),
    });

    res.json({ message: "Onramp session reopened for user to resubmit proof", sessionId });
  } catch (error) {
    console.error("[ADMIN] Error reopening onramp session:", error);
    res.status(500).json({ error: "Failed to reopen onramp session" });
  }
});

router.post("/offramp/reopen/:requestId", adminOnly, async (req, res) => {
  try {
    const { requestId } = req.params;
    const request = await getDocument("offRampRequests", requestId);

    if (!request) {
      return res.status(404).json({ error: "Request not found" });
    }

    await updateDocument("offRampRequests", requestId, {
      status: "awaiting_flow_deposit",
      reopenedAt: new Date().toISOString(),
      reopenedBy: req.user.uid,
      updatedAt: new Date().toISOString(),
    });

    res.json({ message: "Offramp request reopened for user to resubmit proof", requestId });
  } catch (error) {
    console.error("[ADMIN] Error reopening offramp request:", error);
    res.status(500).json({ error: "Failed to reopen offramp request" });
  }
});

router.get("/pending-onramp", adminOnly, async (req, res) => {
  try {
    const sessions = await queryDocuments("onRampSessions", "status", "==", "awaiting_admin_approval");
    sessions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json({ sessions });
  } catch (error) {
    console.error("[ADMIN] Error fetching pending onramp sessions:", error);
    res.status(500).json({ error: "Failed to fetch pending sessions" });
  }
});

router.get("/pending-offramp", adminOnly, async (req, res) => {
  try {
    const requests = await queryDocuments("offRampRequests", "status", "==", "awaiting_admin_approval");
    requests.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json({ requests });
  } catch (error) {
    console.error("[ADMIN] Error fetching pending offramp requests:", error);
    res.status(500).json({ error: "Failed to fetch pending requests" });
  }
});

/**
 * @route   POST /api/admin/approve-onramp/:sessionId
 * @desc    Admin approves an on-ramp session.
 *          If autoTransfer=true (default), automatically sends FLOW to the
 *          user's wallet using transferTokenSimple.cdc via the service wallet.
 *          If autoTransfer=false, records a manually-provided txHash.
 */
router.post("/approve-onramp/:sessionId", adminOnly, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { txHash: manualTxHash, flowSent, adminNote, autoTransfer = true } = req.body;
    const session = await getDocument("onRampSessions", sessionId);

    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }

    if (session.status !== "awaiting_admin_approval") {
      return res.status(400).json({
        error: `Session cannot be approved (current status: ${session.status})`,
      });
    }

    // Mark as processing immediately
    await updateDocument("onRampSessions", sessionId, {
      status: "processing",
      approvedAt: new Date().toISOString(),
      approvedBy: req.user.uid,
      updatedAt: new Date().toISOString(),
    });

    let finalTxHash = manualTxHash || null;
    const amountToSend = parseFloat(flowSent || session.estimatedFLOW).toFixed(8);

    if (autoTransfer && !manualTxHash) {
      // Auto-send FLOW using transferTokenSimple.cdc
      const cadence = fs.readFileSync(
        path.join(__dirname, "../cadence/transactions/transferTokenSimple.cdc"),
        "utf8"
      );

      console.log(`[ADMIN] Auto-transferring ${amountToSend} FLOW to ${session.walletAddress}`);

      const txId = await sendTransaction(cadence, [
        [amountToSend, t.UFix64],
        [session.walletAddress, t.Address],
      ]);

      // Wait for sealing
      await getTransactionStatus(txId);
      finalTxHash = txId;
      console.log(`[ADMIN] FLOW transfer sealed. TxID: ${txId}`);
    } else if (!autoTransfer && !manualTxHash) {
      // Manual mode requires txHash
      await updateDocument("onRampSessions", sessionId, { status: "awaiting_admin_approval", updatedAt: new Date().toISOString() });
      return res.status(400).json({ error: "txHash is required when autoTransfer is false" });
    }

    await updateDocument("onRampSessions", sessionId, {
      status: "completed",
      txHash: finalTxHash,
      flowSent: parseFloat(amountToSend),
      adminNote: adminNote || "",
      completedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    res.json({
      message: "Onramp session approved and FLOW sent",
      sessionId,
      txHash: finalTxHash,
      flowSent: parseFloat(amountToSend),
      autoTransfer: autoTransfer && !manualTxHash,
    });
  } catch (error) {
    console.error("[ADMIN] Error approving onramp session:", error);
    // Revert to awaiting_admin_approval on failure so admin can retry
    try {
      const { sessionId } = req.params;
      await updateDocument("onRampSessions", sessionId, {
        status: "awaiting_admin_approval",
        lastError: error.message,
        updatedAt: new Date().toISOString(),
      });
    } catch (_) {}
    res.status(500).json({ error: "Failed to approve session: " + error.message });
  }
});

router.post("/reject-onramp/:sessionId", adminOnly, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { reason } = req.body;

    const session = await getDocument("onRampSessions", sessionId);

    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }

    if (session.status !== "awaiting_admin_approval") {
      return res.status(400).json({ error: "Session is not awaiting approval" });
    }

    await updateDocument("onRampSessions", sessionId, {
      status: "rejected",
      rejectedAt: new Date().toISOString(),
      rejectedBy: req.user.uid,
      rejectionReason: reason || "Rejected by admin",
      updatedAt: new Date().toISOString(),
    });

    res.json({ message: "Onramp session rejected", sessionId });
  } catch (error) {
    console.error("[ADMIN] Error rejecting onramp session:", error);
    res.status(500).json({ error: "Failed to reject session" });
  }
});

/**
 * @route   POST /api/admin/approve-offramp/:requestId
 * @desc    Admin approves an off-ramp request. Records proof of NGN payout
 *          and marks the request as completed. Admin must manually send
 *          NGN to the user's bank account before or after calling this.
 */
router.post("/approve-offramp/:requestId", adminOnly, async (req, res) => {
  try {
    const { requestId } = req.params;
    const { ngnSent, paymentReference, adminNote } = req.body;
    const request = await getDocument("offRampRequests", requestId);

    if (!request) {
      return res.status(404).json({ error: "Request not found" });
    }

    if (request.status !== "awaiting_admin_approval") {
      return res.status(400).json({
        error: `Request cannot be approved (current status: ${request.status})`,
      });
    }

    if (!ngnSent && !paymentReference) {
      return res.status(400).json({ error: "ngnSent amount or paymentReference is required" });
    }

    await updateDocument("offRampRequests", requestId, {
      status: "completed",
      ngnSent: ngnSent || request.estimatedNGN,
      paymentReference: paymentReference || "",
      adminNote: adminNote || "",
      approvedAt: new Date().toISOString(),
      approvedBy: req.user.uid,
      completedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    res.json({ message: "Offramp request approved and marked as completed", requestId });
  } catch (error) {
    console.error("[ADMIN] Error approving offramp request:", error);
    res.status(500).json({ error: "Failed to approve request" });
  }
});

router.post("/reject-offramp/:requestId", adminOnly, async (req, res) => {
  try {
    const { requestId } = req.params;
    const { reason } = req.body;

    const request = await getDocument("offRampRequests", requestId);

    if (!request) {
      return res.status(404).json({ error: "Request not found" });
    }

    if (request.status !== "awaiting_admin_approval") {
      return res.status(400).json({ error: "Request is not awaiting approval" });
    }

    await updateDocument("offRampRequests", requestId, {
      status: "rejected",
      rejectedAt: new Date().toISOString(),
      rejectedBy: req.user.uid,
      rejectionReason: reason || "Rejected by admin",
      updatedAt: new Date().toISOString(),
    });

    res.json({ message: "Offramp request rejected", requestId });
  } catch (error) {
    console.error("[ADMIN] Error rejecting offramp request:", error);
    res.status(500).json({ error: "Failed to reject request" });
  }
});

router.get("/wallet-balance", adminOnly, async (req, res) => {
  try {
    const balance = await getServiceWalletBalance();
    res.json({ balance });
  } catch (error) {
    console.error("[ADMIN] Error fetching wallet balance:", error);
    res.status(500).json({ error: "Failed to fetch wallet balance" });
  }
});

router.get("/stats", adminOnly, async (req, res) => {
  try {
    const pendingOnramp = await queryDocuments("onRampSessions", "status", "==", "awaiting_admin_approval");
    const pendingOfframp = await queryDocuments("offRampRequests", "status", "==", "awaiting_admin_approval");

    const today = new Date().toISOString().split("T")[0];
    const todayStart = new Date(today).toISOString();
    const todayEnd = new Date(`${today}T23:59:59`).toISOString();

    const completedOnramp = await queryDocuments("onRampSessions", "status", "==", "completed");
    const completedOfframp = await queryDocuments("offRampRequests", "status", "==", "completed");

    const todayOnramp = completedOnramp.filter(
      (tx) => tx.completedAt >= todayStart && tx.completedAt <= todayEnd
    );

    const todayOfframp = completedOfframp.filter(
      (tx) => tx.completedAt >= todayStart && tx.completedAt <= todayEnd
    );

    let balance = "0.0";
    try {
      balance = await getServiceWalletBalance();
    } catch (balErr) {
      console.warn("[ADMIN] Could not fetch wallet balance:", balErr.message);
    }

    res.json({
      pendingOnrampCount: pendingOnramp.length,
      pendingOfframpCount: pendingOfframp.length,
      todayCompletedOnramp: todayOnramp.length,
      todayCompletedOfframp: todayOfframp.length,
      walletBalance: balance,
      totalCompletedOnramp: completedOnramp.length,
      totalCompletedOfframp: completedOfframp.length,
    });
  } catch (error) {
    console.error("[ADMIN] Error fetching stats:", error);
    res.status(500).json({ error: "Failed to fetch statistics" });
  }
});

router.get("/check-role", protect, async (req, res) => {
  try {
    let isAdmin = req.user.role === "admin";

    if (!isAdmin) {
      const user = await getUserById(req.user.uid);
      isAdmin = !!(user && user.customClaims?.role === "admin");
    }

    res.json({
      isAdmin,
      user: {
        uid: req.user.uid,
        email: req.user.email,
        role: isAdmin ? "admin" : "user",
      },
    });
  } catch (error) {
    console.error("[ADMIN] Error checking admin role:", error);
    res.status(500).json({ error: "Failed to check admin role" });
  }
});

module.exports = router;
