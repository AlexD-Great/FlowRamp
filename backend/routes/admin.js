const express = require("express");

/**
 * Loading environment variables
 * Setting up Express
 * Adding CORS middleware
 * Defining API routes
 * Starting the server
 */

const router = express.Router();
const { protect, adminOnly } = require("../lib/auth");
const { 
  getDocument, 
  updateDocument, 
  queryDocuments, 
  createDocument 
} = require("../lib/firebase-admin");
const { processPayment, processOffRampPayout } = require("../lib/payment-processor");
const { getServiceWalletBalance } = require("../lib/flow-client");

/**
 * @route   GET /api/admin/pending-onramp
 * @desc    Get all onramp sessions awaiting admin approval
 * @access  Admin only
 */
router.get("/pending-onramp", adminOnly, async (req, res) => {
  try {
    const sessions = await queryDocuments(
      "onRampSessions", 
      "status", 
      "==", 
      "awaiting_admin_approval"
    );
    
    // Sort by creation date (newest first)
    sessions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    res.json({ sessions });
  } catch (error) {
    console.error("[ADMIN] Error fetching pending onramp sessions:", error);
    res.status(500).json({ error: "Failed to fetch pending sessions" });
  }
});

/**
 * @route   GET /api/admin/pending-offramp
 * @desc    Get all offramp requests awaiting admin approval
 * @access  Admin only
 */
router.get("/pending-offramp", adminOnly, async (req, res) => {
  try {
    const requests = await queryDocuments(
      "offRampRequests", 
      "status", 
      "==", 
      "awaiting_admin_approval"
    );
    
    // Sort by creation date (newest first)
    requests.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    res.json({ requests });
  } catch (error) {
    console.error("[ADMIN] Error fetching pending offramp requests:", error);
    res.status(500).json({ error: "Failed to fetch pending requests" });
  }
});

/**
 * @route   POST /api/admin/approve-onramp/:sessionId
 * @desc    Approve an onramp session and process token transfer
 * @access  Admin only
 */
router.post("/approve-onramp/:sessionId", adminOnly, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const session = await getDocument("onRampSessions", sessionId);

    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }

    if (session.status !== "awaiting_admin_approval") {
      return res.status(400).json({ 
        error: "Session is not awaiting approval" 
      });
    }

    // Check service wallet balance
    const balance = await getServiceWalletBalance();
    const requiredAmount = parseFloat(session.usdAmount);
    
    if (balance < requiredAmount) {
      return res.status(400).json({ 
        error: `Insufficient wallet balance. Required: ${requiredAmount} FLOW, Available: ${balance} FLOW` 
      });
    }

    // Update status to processing
    await updateDocument("onRampSessions", sessionId, {
      status: "processing",
      approvedAt: new Date().toISOString(),
      approvedBy: req.user.uid,
      updatedAt: new Date().toISOString(),
    });

    // Process the payment (transfer tokens)
    await processPayment(sessionId);

    res.json({ 
      message: "Onramp session approved and processed successfully",
      sessionId 
    });

  } catch (error) {
    console.error("[ADMIN] Error approving onramp session:", error);
    res.status(500).json({ error: "Failed to approve session" });
  }
});

/**
 * @route   POST /api/admin/reject-onramp/:sessionId
 * @desc    Reject an onramp session
 * @access  Admin only
 */
router.post("/reject-onramp/:sessionId", adminOnly, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { reason } = req.body;
    
    const session = await getDocument("onRampSessions", sessionId);

    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }

    if (session.status !== "awaiting_admin_approval") {
      return res.status(400).json({ 
        error: "Session is not awaiting approval" 
      });
    }

    await updateDocument("onRampSessions", sessionId, {
      status: "rejected",
      rejectedAt: new Date().toISOString(),
      rejectedBy: req.user.uid,
      rejectionReason: reason || "Rejected by admin",
      updatedAt: new Date().toISOString(),
    });

    res.json({ 
      message: "Onramp session rejected",
      sessionId 
    });

  } catch (error) {
    console.error("[ADMIN] Error rejecting onramp session:", error);
    res.status(500).json({ error: "Failed to reject session" });
  }
});

/**
 * @route   POST /api/admin/approve-offramp/:requestId
 * @desc    Approve an offramp request and process USDT payout
 * @access  Admin only
 */
router.post("/approve-offramp/:requestId", adminOnly, async (req, res) => {
  try {
    const { requestId } = req.params;
    const request = await getDocument("offRampRequests", requestId);

    if (!request) {
      return res.status(404).json({ error: "Request not found" });
    }

    if (request.status !== "awaiting_admin_approval") {
      return res.status(400).json({ 
        error: "Request is not awaiting approval" 
      });
    }

    // Update status to processing
    await updateDocument("offRampRequests", requestId, {
      status: "processing",
      approvedAt: new Date().toISOString(),
      approvedBy: req.user.uid,
      updatedAt: new Date().toISOString(),
    });

    // Process the offramp payout
    await processOffRampPayout(requestId, request.payoutDetails);

    res.json({ 
      message: "Offramp request approved and processed successfully",
      requestId 
    });

  } catch (error) {
    console.error("[ADMIN] Error approving offramp request:", error);
    res.status(500).json({ error: "Failed to approve request" });
  }
});

/**
 * @route   POST /api/admin/reject-offramp/:requestId
 * @desc    Reject an offramp request
 * @access  Admin only
 */
router.post("/reject-offramp/:requestId", adminOnly, async (req, res) => {
  try {
    const { requestId } = req.params;
    const { reason } = req.body;
    
    const request = await getDocument("offRampRequests", requestId);

    if (!request) {
      return res.status(404).json({ error: "Request not found" });
    }

    if (request.status !== "awaiting_admin_approval") {
      return res.status(400).json({ 
        error: "Request is not awaiting approval" 
      });
    }

    await updateDocument("offRampRequests", requestId, {
      status: "rejected",
      rejectedAt: new Date().toISOString(),
      rejectedBy: req.user.uid,
      rejectionReason: reason || "Rejected by admin",
      updatedAt: new Date().toISOString(),
    });

    res.json({ 
      message: "Offramp request rejected",
      requestId 
    });

  } catch (error) {
    console.error("[ADMIN] Error rejecting offramp request:", error);
    res.status(500).json({ error: "Failed to reject request" });
  }
});

/**
 * @route   GET /api/admin/wallet-balance
 * @desc    Get service wallet balance
 * @access  Admin only
 */
router.get("/wallet-balance", adminOnly, async (req, res) => {
  try {
    const balance = await getServiceWalletBalance();
    res.json({ balance });
  } catch (error) {
    console.error("[ADMIN] Error fetching wallet balance:", error);
    res.status(500).json({ error: "Failed to fetch wallet balance" });
  }
});

/**
 * @route   GET /api/admin/stats
 * @desc    Get admin dashboard statistics
 * @access  Admin only
 */
router.get("/stats", adminOnly, async (req, res) => {
  try {
    // Get pending counts
    const pendingOnramp = await queryDocuments(
      "onRampSessions", 
      "status", 
      "==", 
      "awaiting_admin_approval"
    );
    
    const pendingOfframp = await queryDocuments(
      "offRampRequests", 
      "status", 
      "==", 
      "awaiting_admin_approval"
    );

    // Get today's completed transactions
    const today = new Date().toISOString().split('T')[0];
    const todayStart = new Date(today).toISOString();
    const todayEnd = new Date(today + 'T23:59:59').toISOString();

    const completedOnramp = await queryDocuments(
      "onRampSessions", 
      "status", 
      "==", 
      "completed"
    );
    
    const completedOfframp = await queryDocuments(
      "offRampRequests", 
      "status", 
      "==", 
      "completed"
    );

    // Filter today's completed transactions
    const todayOnramp = completedOnramp.filter(
      tx => tx.completedAt >= todayStart && tx.completedAt <= todayEnd
    );
    
    const todayOfframp = completedOfframp.filter(
      tx => tx.completedAt >= todayStart && tx.completedAt <= todayEnd
    );

    // Get wallet balance
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

module.exports = router;
