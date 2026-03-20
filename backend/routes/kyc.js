const express = require("express");
const router = express.Router();
const { protect } = require("../lib/auth");
const { createDocument, getDocument, updateDocument, queryDocuments } = require("../lib/firebase-admin");
const { BVNVerifier } = require("../lib/nin-verifier");

const bvnVerifier = new BVNVerifier();

/**
 * @route   GET /api/kyc/status
 * @desc    Get KYC verification status for authenticated user
 * @access  Private
 */
router.get("/status", protect, async (req, res) => {
  try {
    const { uid } = req.user;

    const kycRecords = await queryDocuments("kycVerifications", "userId", "==", uid);

    if (kycRecords.length === 0) {
      return res.json({
        status: "not_started",
        emailVerified: req.user.email_verified || false,
        submittedAt: null,
        reviewedAt: null,
        message: "KYC verification not started",
        bvnVerified: false,
      });
    }

    const kycRecord = kycRecords[0];

    res.json({
      status: kycRecord.status || "pending",
      emailVerified: req.user.email_verified || false,
      submittedAt: kycRecord.submittedAt,
      reviewedAt: kycRecord.reviewedAt,
      message: kycRecord.message || null,
      bvnVerified: kycRecord.bvnVerified || false,
      verifiedName: kycRecord.bvnVerified ? {
        firstName: kycRecord.bvnFirstName,
        lastName: kycRecord.bvnLastName,
      } : null,
    });
  } catch (error) {
    console.error("Get KYC status error:", error);
    res.status(500).json({ error: "Failed to get KYC status" });
  }
});

/**
 * @route   POST /api/kyc/verify-bvn
 * @desc    Verify user's BVN (Bank Verification Number) via Paystack.
 *          On success, auto-approves KYC and stores verified identity data.
 * @access  Private
 */
router.post("/verify-bvn", protect, async (req, res) => {
  try {
    const { uid, email } = req.user;
    const { bvn } = req.body;

    if (!bvn) {
      return res.status(400).json({ error: "BVN is required" });
    }

    if (!/^\d{11}$/.test(bvn)) {
      return res.status(400).json({ error: "BVN must be exactly 11 digits" });
    }

    // Check if user already has approved KYC
    const existingRecords = await queryDocuments("kycVerifications", "userId", "==", uid);
    if (existingRecords.length > 0 && existingRecords[0].status === "approved") {
      return res.status(400).json({ error: "KYC already approved" });
    }

    // Verify BVN via Paystack
    const result = await bvnVerifier.verifyBVN(bvn);

    if (!result.verified) {
      const failData = {
        userId: uid,
        email,
        bvnMasked: bvn.substring(0, 3) + "****" + bvn.substring(7),
        status: "rejected",
        bvnVerified: false,
        message: result.message || "BVN verification failed",
        submittedAt: new Date().toISOString(),
        reviewedAt: new Date().toISOString(),
      };

      if (existingRecords.length > 0) {
        await updateDocument("kycVerifications", existingRecords[0].id, failData);
      } else {
        await createDocument("kycVerifications", failData);
      }

      return res.status(400).json({
        verified: false,
        message: result.message || "BVN verification failed. Please check your BVN and try again.",
      });
    }

    // BVN verified — auto-approve KYC
    const kycData = {
      userId: uid,
      email,
      fullName: `${result.data.firstName} ${result.data.middleName ? result.data.middleName + " " : ""}${result.data.lastName}`.trim(),
      bvnFirstName: result.data.firstName,
      bvnLastName: result.data.lastName,
      bvnMiddleName: result.data.middleName || "",
      dateOfBirth: result.data.dateOfBirth || "",
      country: "Nigeria",
      documentType: "BVN",
      bvnVerified: true,
      status: "approved",
      submittedAt: new Date().toISOString(),
      reviewedAt: new Date().toISOString(),
      reviewedBy: "system_bvn_verification",
    };

    let kycId;
    if (existingRecords.length > 0) {
      kycId = existingRecords[0].id;
      await updateDocument("kycVerifications", kycId, kycData);
    } else {
      kycId = await createDocument("kycVerifications", kycData);
    }

    res.json({
      verified: true,
      kycId,
      status: "approved",
      message: "BVN verified successfully! Your KYC is now approved.",
      verifiedName: {
        firstName: result.data.firstName,
        lastName: result.data.lastName,
      },
    });
  } catch (error) {
    console.error("BVN verification error:", error);
    res.status(500).json({ error: error.message || "BVN verification failed. Please try again later." });
  }
});

/**
 * @route   POST /api/kyc/submit
 * @desc    Submit KYC verification documents (legacy manual flow).
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
    };

    let kycId;
    if (existingRecords.length > 0) {
      kycId = existingRecords[0].id;
      await updateDocument("kycVerifications", kycId, kycData);
    } else {
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

    const kycRecords = await queryDocuments("kycVerifications", "userId", "==", uid);
    const isVerified = kycRecords.length > 0 && kycRecords[0].status === "approved";

    const limits = {
      verified: isVerified,
      daily: {
        onramp: isVerified ? 50000 : 10000,
        offramp: isVerified ? 50000 : 10000,
      },
      monthly: {
        onramp: isVerified ? 1000000 : 100000,
        offramp: isVerified ? 1000000 : 100000,
      },
      perTransaction: {
        min: 1000,
        max: isVerified ? 100000 : 20000,
      }
    };

    res.json(limits);
  } catch (error) {
    console.error("Get KYC limits error:", error);
    res.status(500).json({ error: "Failed to get limits" });
  }
});

module.exports = router;
