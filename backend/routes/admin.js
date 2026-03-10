const express = require("express");

const router = express.Router();
const { protect, adminOnly } = require("../lib/auth");
const {
  getDocument,
  updateDocument,
  queryDocuments,
  getUserById,
  db,
} = require("../lib/firebase-admin");
const { processPayment, processOffRampPayout } = require("../lib/payment-processor");
const { getServiceWalletBalance } = require("../lib/flow-client");

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

router.post("/onramp/retry/:sessionId", adminOnly, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const session = await getDocument("onRampSessions", sessionId);

    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }

    await updateDocument("onRampSessions", sessionId, {
      status: "processing",
      retriedAt: new Date().toISOString(),
      retriedBy: req.user.uid,
      updatedAt: new Date().toISOString(),
    });

    await processPayment(sessionId);

    res.json({ message: "Onramp retry triggered", sessionId });
  } catch (error) {
    console.error("[ADMIN] Error retrying onramp session:", error);
    res.status(500).json({ error: "Failed to retry onramp session" });
  }
});

router.post("/offramp/retry/:requestId", adminOnly, async (req, res) => {
  try {
    const { requestId } = req.params;
    const request = await getDocument("offRampRequests", requestId);

    if (!request) {
      return res.status(404).json({ error: "Request not found" });
    }

    await updateDocument("offRampRequests", requestId, {
      status: "processing",
      retriedAt: new Date().toISOString(),
      retriedBy: req.user.uid,
      updatedAt: new Date().toISOString(),
    });

    await processOffRampPayout(requestId, request.payoutDetails);

    res.json({ message: "Offramp retry triggered", requestId });
  } catch (error) {
    console.error("[ADMIN] Error retrying offramp request:", error);
    res.status(500).json({ error: "Failed to retry offramp request" });
  }
});

router.get("/pending-onramp", adminOnly, async (req, res) => {
  try {
    const sessions = await queryDocuments(
      "onRampSessions",
      "status",
      "==",
      "awaiting_admin_approval"
    );

    sessions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json({ sessions });
  } catch (error) {
    console.error("[ADMIN] Error fetching pending onramp sessions:", error);
    res.status(500).json({ error: "Failed to fetch pending sessions" });
  }
});

router.get("/pending-offramp", adminOnly, async (req, res) => {
  try {
    const requests = await queryDocuments(
      "offRampRequests",
      "status",
      "==",
      "awaiting_admin_approval"
    );

    requests.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json({ requests });
  } catch (error) {
    console.error("[ADMIN] Error fetching pending offramp requests:", error);
    res.status(500).json({ error: "Failed to fetch pending requests" });
  }
});

router.post("/approve-onramp/:sessionId", adminOnly, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const session = await getDocument("onRampSessions", sessionId);

    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }

    if (session.status !== "awaiting_admin_approval") {
      return res.status(400).json({ error: "Session is not awaiting approval" });
    }

    const balance = await getServiceWalletBalance();
    const requiredAmount = parseFloat(session.usdAmount);

    if (balance < requiredAmount) {
      return res.status(400).json({
        error: `Insufficient wallet balance. Required: ${requiredAmount} FLOW, Available: ${balance} FLOW`,
      });
    }

    await updateDocument("onRampSessions", sessionId, {
      status: "processing",
      approvedAt: new Date().toISOString(),
      approvedBy: req.user.uid,
      updatedAt: new Date().toISOString(),
    });

    await processPayment(sessionId);

    res.json({ message: "Onramp session approved and processed successfully", sessionId });
  } catch (error) {
    console.error("[ADMIN] Error approving onramp session:", error);
    res.status(500).json({ error: "Failed to approve session" });
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

router.post("/approve-offramp/:requestId", adminOnly, async (req, res) => {
  try {
    const { requestId } = req.params;
    const request = await getDocument("offRampRequests", requestId);

    if (!request) {
      return res.status(404).json({ error: "Request not found" });
    }

    if (request.status !== "awaiting_admin_approval") {
      return res.status(400).json({ error: "Request is not awaiting approval" });
    }

    await updateDocument("offRampRequests", requestId, {
      status: "processing",
      approvedAt: new Date().toISOString(),
      approvedBy: req.user.uid,
      updatedAt: new Date().toISOString(),
    });

    await processOffRampPayout(requestId, request.payoutDetails);

    res.json({ message: "Offramp request approved and processed successfully", requestId });
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

    const balance = await getServiceWalletBalance();

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
