const axios = require("axios");

/**
 * BVN (Bank Verification Number) identity verification for Nigerian users.
 * Uses the Paystack API — same key you already have for payments.
 *
 * Required env vars:
 *   PAYSTACK_SECRET_KEY — Your Paystack secret key (already configured for payments)
 *
 * Paystack's "Resolve BVN" endpoint returns the customer's registered name,
 * DOB, phone, etc. — sufficient for KYC identity verification.
 */

class BVNVerifier {
  constructor() {
    this.secretKey = process.env.PAYSTACK_SECRET_KEY || process.env.PAYMENT_PROVIDER_SECRET_KEY;

    if (!this.secretKey) {
      console.warn("[KYC] Paystack secret key not configured. Set PAYSTACK_SECRET_KEY.");
    }

    this.httpClient = axios.create({
      baseURL: "https://api.paystack.co",
      headers: {
        Authorization: `Bearer ${this.secretKey}`,
        "Content-Type": "application/json",
      },
    });
  }

  /**
   * Verify a BVN using Paystack's Resolve BVN endpoint.
   *
   * @param {string} bvn - The 11-digit BVN
   * @returns {object} - { verified, data: { firstName, lastName, phone, dob } }
   */
  async verifyBVN(bvn) {
    if (!this.secretKey) {
      throw new Error("KYC verification service not configured. Contact support.");
    }

    if (!bvn || bvn.length !== 11 || !/^\d{11}$/.test(bvn)) {
      throw new Error("Invalid BVN. Must be exactly 11 digits.");
    }

    try {
      const response = await this.httpClient.get(
        `/bank/resolve_bvn/${encodeURIComponent(bvn)}`
      );

      const result = response.data;

      if (result.status === true && result.data) {
        const data = result.data;
        return {
          verified: true,
          data: {
            firstName: data.first_name || "",
            lastName: data.last_name || "",
            middleName: data.middle_name || "",
            phone: data.mobile || data.phone || "",
            dateOfBirth: data.dob || data.formatted_dob || "",
          },
        };
      }

      return {
        verified: false,
        message: result.message || "BVN verification failed. Please check your BVN and try again.",
      };
    } catch (error) {
      const statusCode = error.response?.status;
      const errData = error.response?.data;
      const errMsg = errData?.message || error.message;
      console.error("[KYC] BVN verification error:", errMsg);

      if (statusCode === 404 || errMsg?.toLowerCase().includes("not found")) {
        return {
          verified: false,
          message: "BVN not found. Please check the number and try again.",
        };
      }

      if (statusCode === 401 || statusCode === 403) {
        console.error("[KYC] Auth failed — check PAYSTACK_SECRET_KEY.");
        throw new Error("KYC verification service configuration error. Contact support.");
      }

      if (statusCode === 422) {
        return {
          verified: false,
          message: errMsg || "Invalid BVN format. Please check and try again.",
        };
      }

      throw new Error("KYC verification service temporarily unavailable. Please try again later.");
    }
  }
}

module.exports = { BVNVerifier };
