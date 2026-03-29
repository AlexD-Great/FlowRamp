const axios = require("axios");
const crypto = require("crypto");

const PAYSTACK_BASE_URL = "https://api.paystack.co";

class PaymentProvider {
  constructor(provider = "paystack") {
    if (provider !== "paystack") {
      throw new Error("Only Paystack is supported in this implementation.");
    }
    this.provider = provider;
    this.secretKey = process.env.PAYSTACK_SECRET_KEY || process.env.PAYMENT_PROVIDER_SECRET_KEY;
    if (!this.secretKey) {
      console.warn("[PAYSTACK] No secret key configured. Set PAYSTACK_SECRET_KEY in env.");
    }
    this.httpClient = axios.create({
      baseURL: PAYSTACK_BASE_URL,
      headers: {
        Authorization: `Bearer ${this.secretKey}`,
        "Content-Type": "application/json",
      },
    });
  }

  /**
   * Initialize a Paystack transaction for on-ramp (user pays NGN).
   * Returns authorization_url for redirect and reference for tracking.
   */
  async initializeTransaction({ amount, email, metadata, callbackUrl }) {
    try {
      const response = await this.httpClient.post("/transaction/initialize", {
        amount: Math.round(amount * 100), // Paystack expects kobo
        currency: "NGN",
        email,
        metadata,
        callback_url: callbackUrl,
      });

      const { data } = response.data;
      return {
        authorizationUrl: data.authorization_url,
        accessCode: data.access_code,
        reference: data.reference,
      };
    } catch (error) {
      console.error("[PAYSTACK] Initialize transaction error:", error.response?.data || error.message);
      throw new Error("Failed to initialize payment. Please try again.");
    }
  }

  /**
   * Verify a Paystack transaction by reference.
   */
  async verifyTransaction(reference) {
    try {
      const response = await this.httpClient.get(`/transaction/verify/${encodeURIComponent(reference)}`);
      const { data } = response.data;
      return {
        status: data.status, // "success", "failed", "abandoned"
        amount: data.amount / 100, // Convert from kobo to NGN
        reference: data.reference,
        paidAt: data.paid_at,
        channel: data.channel,
        currency: data.currency,
        metadata: data.metadata,
      };
    } catch (error) {
      console.error("[PAYSTACK] Verify transaction error:", error.response?.data || error.message);
      throw new Error("Failed to verify payment.");
    }
  }

  /**
   * Verify Paystack webhook signature using HMAC SHA512.
   */
  verifyWebhookSignature(signature, payload) {
    const hash = crypto
      .createHmac("sha512", this.secretKey)
      .update(JSON.stringify(payload))
      .digest("hex");
    return hash === signature;
  }

  /**
   * Get list of Nigerian banks from Paystack.
   */
  async getBankList() {
    try {
      const response = await this.httpClient.get("/bank?country=nigeria");
      return response.data.data; // Array of { name, code, ... }
    } catch (error) {
      console.error("[PAYSTACK] Get bank list error:", error.response?.data || error.message);
      throw new Error("Failed to fetch bank list.");
    }
  }

  /**
   * Resolve account number to get account name via Paystack.
   */
  async resolveAccountNumber(accountNumber, bankCode) {
    try {
      const response = await this.httpClient.get(
        `/bank/resolve?account_number=${accountNumber}&bank_code=${bankCode}`
      );
      return {
        accountNumber: response.data.data.account_number,
        accountName: response.data.data.account_name,
      };
    } catch (error) {
      console.error("[PAYSTACK] Resolve account error:", error.response?.data || error.message);
      throw new Error("Could not resolve account. Please check the account number and bank.");
    }
  }

  /**
   * Create a transfer recipient (required before initiating a transfer).
   */
  async createTransferRecipient({ accountName, accountNumber, bankCode }) {
    try {
      const response = await this.httpClient.post("/transferrecipient", {
        type: "nuban",
        name: accountName,
        account_number: accountNumber,
        bank_code: bankCode,
        currency: "NGN",
      });

      const { data } = response.data;
      return {
        recipientCode: data.recipient_code,
        name: data.name,
        active: data.active,
      };
    } catch (error) {
      console.error("[PAYSTACK] Create recipient error:", error.response?.data || error.message);
      const detail = error.response?.data?.message || error.message;
      throw new Error(`Failed to create transfer recipient: ${detail}`);
    }
  }

  /**
   * Initiate a transfer (payout) to a recipient.
   */
  async initiateTransfer({ amount, recipientCode, reason, reference }) {
    try {
      const response = await this.httpClient.post("/transfer", {
        source: "balance",
        amount: Math.round(amount * 100), // Paystack expects kobo
        recipient: recipientCode,
        reason: reason || "FlowRamp NGN payout",
        reference,
      });

      const { data } = response.data;
      return {
        transferCode: data.transfer_code,
        reference: data.reference,
        status: data.status, // "pending", "success", etc.
        amount: data.amount / 100,
      };
    } catch (error) {
      console.error("[PAYSTACK] Initiate transfer error:", error.response?.data || error.message);
      const detail = error.response?.data?.message || error.message;
      throw new Error(`Failed to initiate payout transfer: ${detail}`);
    }
  }
}

module.exports = {
  PaymentProvider,
};
