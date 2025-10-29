const express = require("express");
const router = express.Router();
const { protect } = require("../lib/auth");
const { createDocument, getDocument, updateDocument, queryDocuments } = require("../lib/firebase-admin");

/**
 * @route   GET /api/kyc/status
 * @desc    Get KYC verification status for authenticated user
 * @access  Private
 */
router.get("/status", protect, async (req, res) => {
  try {
    const { uid } = req.user;
    
    // Query KYC record for user
    const kycRecords = await queryDocuments("kycVerifications", "userId", "==", uid);
    
    if (kycRecords.length === 0) {
      // No KYC record exists
      return res.json({
        status: "not_started",
        emailVerified: req.user.email_verified || false,
        submittedAt: null,
        reviewedAt: null,
        message: "KYC verification not started"
      });
    }

    const kycRecord = kycRecords[0];
    
    res.json({
      status: kycRecord.status || "pending",
      emailVerified: req.user.email_verified || false,
      submittedAt: kycRecord.submittedAt,
      reviewedAt: kycRecord.reviewedAt,
      message: kycRecord.message || null,
      documents: kycRecord.documents ? kycRecord.documents.map(d => d.type) : []
    });
  } catch (error) {
    console.error("Get KYC status error:", error);
    res.status(500).json({ error: "Failed to get KYC status" });
  }
});

/**
 * @route   POST /api/kyc/submit
 * @desc    Submit KYC verification documents
 * @access  Private
 */
router.post("/submit", protect, async (req, res) => {
  try {
    const { uid, email } = req.user;
    const { 
      fullName, 
      dateOfBirth, 
      country, 
      documentType,
      documentNumber 
    } = req.body;

    if (!fullName || !dateOfBirth || !country || !documentType || !documentNumber) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Check if user already has a KYC record
    const existingRecords = await queryDocuments("kycVerifications", "userId", "==", uid);
    
    if (existingRecords.length > 0 && existingRecords[0].status === "approved") {
      return res.status(400).json({ error: "KYC already approved" });
    }

    const kycData = {
      userId: uid,
      email,
      fullName,
      dateOfBirth,
      country,
      documentType,
      documentNumber,
      status: "pending",
      submittedAt: new Date().toISOString(),
      reviewedAt: null,
      reviewedBy: null,
      documents: [], // In production, this would include uploaded document URLs
    };

    let kycId;
    if (existingRecords.length > 0) {
      // Update existing record
      kycId = existingRecords[0].id;
      await updateDocument("kycVerifications", kycId, kycData);
    } else {
      // Create new record
      kycId = await createDocument("kycVerifications", kycData);
    }

    res.json({
      kycId,
      status: "pending",
      message: "KYC verification submitted successfully. We'll review your documents within 1-2 business days."
    });
  } catch (error) {
    console.error("Submit KYC error:", error);
    res.status(500).json({ error: "Failed to submit KYC" });
  }
});

/**
 * @route   GET /api/kyc/limits
 * @desc    Get transaction limits based on KYC status
 * @access  Private
 */
router.get("/limits", protect, async (req, res) => {
  try {
    const { uid } = req.user;
    
    // Get KYC status
    const kycRecords = await queryDocuments("kycVerifications", "userId", "==", uid);
    const isVerified = kycRecords.length > 0 && kycRecords[0].status === "approved";

    const limits = {
      verified: isVerified,
      daily: {
        onramp: isVerified ? 50000 : 10000,  // NGN
        offramp: isVerified ? 50000 : 10000, // NGN
      },
      monthly: {
        onramp: isVerified ? 1000000 : 100000,  // NGN
        offramp: isVerified ? 1000000 : 100000, // NGN
      },
      perTransaction: {
        min: 1000,  // NGN
        max: isVerified ? 100000 : 20000, // NGN
      }
    };

    res.json(limits);
  } catch (error) {
    console.error("Get KYC limits error:", error);
    res.status(500).json({ error: "Failed to get limits" });
  }
});

module.exports = router;
