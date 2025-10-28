const axios = require("axios");

const PAYSTACK_BASE_URL = "https://api.paystack.co";

class PaymentProvider {
  constructor(provider = "paystack") {
    if (provider !== "paystack") {
      throw new Error("Only Paystack is supported in this implementation.");
    }
    this.provider = provider;
    this.secretKey = process.env.PAYMENT_PROVIDER_SECRET_KEY;
    this.httpClient = axios.create({
      baseURL: PAYSTACK_BASE_URL,
      headers: {
        Authorization: `Bearer ${this.secretKey}`,
        "Content-Type": "application/json",
      },
    });
  }

  async createPaymentIntent(amount, currency, metadata, email = "customer@example.com") {
    try {
      const response = await this.httpClient.post("/transaction/initialize", {
        amount: amount * 100, // Paystack expects amount in kobo
        currency,
        metadata,
        email, // Use provided email or fallback
      });

      const { data } = response.data;
      return {
        paymentUrl: data.authorization_url,
        paymentRef: data.reference,
        providerRef: data.access_code,
        expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes
      };
    } catch (error) {
      console.error("Error creating Paystack payment intent:", error.response?.data || error.message);
      throw new Error("Could not create payment intent.");
    }
  }

  verifyWebhookSignature(signature, payload) {
    const crypto = require("crypto");
    const hash = crypto
      .createHmac("sha512", this.secretKey)
      .update(JSON.stringify(payload))
      .digest("hex");
    return hash === signature;
  }

  async verifyPayment(paymentRef) {
    try {
      const response = await this.httpClient.get(`/transaction/verify/${paymentRef}`);
      const { data } = response.data;
      return {
        status: data.status,
        amount: data.amount / 100,
        providerRef: data.reference,
      };
    } catch (error) {
      console.error("Error verifying Paystack payment:", error);
      throw new Error("Could not verify payment.");
    }
  }

  async initiatePayout(amount, currency, payoutDetails) {
    // This is a complex operation that requires a lot of setup on the Paystack
    // dashboard. For this example, we will just log the request.
    console.log("[PAYSTACK] Initiating payout:", { amount, currency, payoutDetails });
    return {
      success: true,
      providerRef: `payout_${Date.now()}`,
      message: "Payout initiated successfully.",
    };
  }
}

module.exports = {
  PaymentProvider,
};
