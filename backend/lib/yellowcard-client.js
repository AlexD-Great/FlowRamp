const axios = require("axios");
const crypto = require("crypto");

/**
 * Yellow Card API Client
 * Handles NGN collections (on-ramp), NGN payments (off-ramp), and rate lookups.
 * 
 * Yellow Card terminology:
 *   - Collection = Collect fiat (NGN) from a customer → credits your USD float
 *   - Payment    = Send fiat (NGN) to a customer's bank → debits your USD float
 * 
 * Docs: https://docs.yellowcard.engineering
 */
class YellowCardClient {
  constructor() {
    this.apiKey = process.env.YELLOWCARD_API_KEY;
    this.secretKey = process.env.YELLOWCARD_SECRET_KEY;
    this.baseUrl = process.env.YELLOWCARD_BASE_URL || "https://sandbox.yellowcard.engineering";

    if (!this.apiKey || !this.secretKey) {
      console.warn("[YELLOWCARD] WARNING: YELLOWCARD_API_KEY or YELLOWCARD_SECRET_KEY not set");
    }

    this.httpClient = axios.create({
      baseURL: this.baseUrl,
      headers: { "Content-Type": "application/json" },
      timeout: 30000,
    });
  }

  // ═══════════════════════════════════════════════════════════
  // AUTHENTICATION — HMAC-SHA256 request signing
  // ═══════════════════════════════════════════════════════════

  /**
   * Generate auth headers for a Yellow Card API request.
   * Scheme: YcHmacV1 {apikey}:{signature}
   * Message = timestamp + path + METHOD + base64(sha256(body))
   */
  _getAuthHeaders(method, path, body = null) {
    const timestamp = new Date().toISOString();

    let message = timestamp + path + method.toUpperCase();
    if (body && (method.toUpperCase() === "POST" || method.toUpperCase() === "PUT")) {
      const bodyString = typeof body === "string" ? body : JSON.stringify(body);
      const bodyHash = crypto.createHash("sha256").update(bodyString).digest("base64");
      message += bodyHash;
    }

    const signature = crypto
      .createHmac("sha256", this.secretKey)
      .update(message)
      .digest("base64");

    return {
      Authorization: `YcHmacV1 ${this.apiKey}:${signature}`,
      "X-YC-Timestamp": timestamp,
    };
  }

  /**
   * Make an authenticated request to the Yellow Card API.
   */
  async _request(method, path, data = null) {
    const authHeaders = this._getAuthHeaders(method, path, data);

    try {
      const config = {
        method,
        url: path,
        headers: { ...authHeaders },
      };
      if (data) config.data = data;

      const response = await this.httpClient(config);
      return response.data;
    } catch (error) {
      this._handleError(`${method} ${path}`, error);
    }
  }

  // ═══════════════════════════════════════════════════════════
  // CHANNELS, NETWORKS & RATES
  // ═══════════════════════════════════════════════════════════

  /**
   * Get all supported payment channels (Bank Transfer, Mobile Money, etc).
   * Filter by country code (e.g. "NG" for Nigeria).
   * @param {string} countryCode - ISO country code
   * @returns {Promise<Array>} Array of channel objects with id, name, limits, etc.
   */
  async getChannels(countryCode = "NG") {
    const channels = await this._request("GET", "/business/channels");
    if (countryCode && Array.isArray(channels)) {
      return channels.filter((ch) => ch.countryCode === countryCode);
    }
    return channels;
  }

  /**
   * Get available networks for a country (banks, mobile money providers).
   * @param {string} countryCode
   * @returns {Promise<Array>} Array of network objects with id, name, type
   */
  async getNetworks(countryCode = "NG") {
    const networks = await this._request("GET", "/business/networks");
    if (countryCode && Array.isArray(networks)) {
      return networks.filter((n) => n.countryCode === countryCode);
    }
    return networks;
  }

  /**
   * Get current exchange rates.
   * Returns buy/sell rates for USD/NGN (and other currencies).
   * @returns {Promise<Object>} Rates object
   */
  async getRates() {
    return await this._request("GET", "/business/rates");
  }

  /**
   * Get the NGN/USD rate specifically.
   * @returns {Promise<{buy: number, sell: number, code: string}>}
   *   buy  = how much NGN per 1 USD (for collections: user pays NGN, you get USD)
   *   sell = how much NGN per 1 USD (for payments: you spend USD, user gets NGN)
   */
  async getNGNRate() {
    const rates = await this.getRates();
    const ngnRate = Array.isArray(rates)
      ? rates.find((r) => r.code === "NGN" || r.currency === "NGN")
      : null;

    if (!ngnRate) {
      throw new Error("NGN rate not found in Yellow Card rates response");
    }

    return {
      buy: parseFloat(ngnRate.buy),   // Collection rate: NGN per USD
      sell: parseFloat(ngnRate.sell), // Payment rate: NGN per USD
      code: "NGN",
      raw: ngnRate,
    };
  }

  /**
   * Resolve a bank account — verify account name before payment.
   * @param {string} accountNumber
   * @param {string} networkId - Bank network ID from getNetworks()
   * @returns {Promise<Object>} Resolved account details
   */
  async resolveBankAccount(accountNumber, networkId) {
    return await this._request("POST", "/business/account/resolve", {
      accountNumber,
      networkId,
    });
  }

  /**
   * Get the account/balance info.
   * @returns {Promise<Object>} Account details including USD float balance
   */
  async getAccount() {
    return await this._request("GET", "/business/account");
  }

  // ═══════════════════════════════════════════════════════════
  // COLLECTIONS — Collect NGN from user → credit USD float
  // (Used for on-ramp: user pays NGN to buy FLOW)
  // ═══════════════════════════════════════════════════════════

  /**
   * Submit a collection request.
   * Yellow Card will return bank details for the user to pay into.
   * Once user pays, a webhook fires and your USD float is credited.
   *
   * @param {Object} params
   * @param {number} params.amount - Amount in local currency (NGN)
   * @param {string} params.currency - "NGN"
   * @param {string} params.channelId - Channel ID from getChannels()
   * @param {string} params.sequenceId - Unique idempotency key (use your session ID)
   * @param {string} params.reason - Payment reason (e.g. "crypto_purchase")
   * @param {Object} params.source - Source account details
   * @param {string} params.source.accountNumber - User's bank account or phone
   * @param {string} params.source.accountType - "bank" or "momo"
   * @param {string} params.source.networkId - Bank/provider network ID
   * @param {string} [params.source.accountName] - Account holder name
   * @returns {Promise<Object>} Collection object with id, status, bankDetails, etc.
   */
  async submitCollection(params) {
    const body = {
      amount: params.amount,
      currency: params.currency || "NGN",
      channelId: params.channelId,
      sequenceId: params.sequenceId,
      reason: params.reason || "crypto_purchase",
      source: params.source,
    };

    if (params.customerName) body.customerName = params.customerName;
    if (params.forceAccept) body.forceAccept = params.forceAccept;

    console.log(`[YELLOWCARD] Submitting collection: ₦${params.amount}, seq=${params.sequenceId}`);
    return await this._request("POST", "/business/collections", body);
  }

  /**
   * Accept (confirm) a collection request after reviewing the quote.
   * @param {string} collectionId - ID from submitCollection response
   * @returns {Promise<Object>} Updated collection object
   */
  async acceptCollection(collectionId) {
    console.log(`[YELLOWCARD] Accepting collection: ${collectionId}`);
    return await this._request("POST", `/business/collections/${collectionId}/accept`);
  }

  /**
   * Deny (cancel) a collection request.
   * @param {string} collectionId
   * @returns {Promise<Object>}
   */
  async denyCollection(collectionId) {
    console.log(`[YELLOWCARD] Denying collection: ${collectionId}`);
    return await this._request("POST", `/business/collections/${collectionId}/deny`);
  }

  /**
   * Lookup a specific collection by ID.
   * @param {string} collectionId
   * @returns {Promise<Object>} Collection details with status, amounts, etc.
   */
  async getCollection(collectionId) {
    return await this._request("GET", `/business/collections/${collectionId}`);
  }

  /**
   * List all collections (with optional pagination).
   * @param {Object} [params] - Query params like page, limit
   * @returns {Promise<Array>}
   */
  async listCollections(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const path = queryString ? `/business/collections?${queryString}` : "/business/collections";
    return await this._request("GET", path);
  }

  // ═══════════════════════════════════════════════════════════
  // PAYMENTS — Send NGN to user's bank → debit USD float
  // (Used for off-ramp: user sells FLOW, receives NGN)
  // ═══════════════════════════════════════════════════════════

  /**
   * Submit a payment request (disbursement).
   * Sends NGN to the user's bank account, debiting your USD float.
   *
   * @param {Object} params
   * @param {number} params.amount - Amount in local currency (NGN) to send
   * @param {string} params.currency - "NGN"
   * @param {string} params.channelId - Channel ID from getChannels()
   * @param {string} params.sequenceId - Unique idempotency key (use your request ID)
   * @param {string} params.reason - Payment reason (e.g. "crypto_sale")
   * @param {Object} params.destination - Destination bank details
   * @param {string} params.destination.accountNumber - User's bank account
   * @param {string} params.destination.accountName - Account holder name
   * @param {string} params.destination.accountType - "bank" or "momo"
   * @param {string} params.destination.networkId - Bank network ID from getNetworks()
   * @returns {Promise<Object>} Payment object with id, status, rate locked, etc.
   */
  async submitPayment(params) {
    const body = {
      amount: params.amount,
      currency: params.currency || "NGN",
      channelId: params.channelId,
      sequenceId: params.sequenceId,
      reason: params.reason || "crypto_sale",
      destination: params.destination,
    };

    if (params.forceAccept) body.forceAccept = params.forceAccept;

    console.log(`[YELLOWCARD] Submitting payment: ₦${params.amount} to ${params.destination.accountNumber}, seq=${params.sequenceId}`);
    return await this._request("POST", "/business/payments", body);
  }

  /**
   * Accept (confirm) a payment request after reviewing the quote.
   * @param {string} paymentId - ID from submitPayment response
   * @returns {Promise<Object>} Updated payment object
   */
  async acceptPayment(paymentId) {
    console.log(`[YELLOWCARD] Accepting payment: ${paymentId}`);
    return await this._request("POST", `/business/payments/${paymentId}/accept`);
  }

  /**
   * Deny (cancel) a payment request.
   * @param {string} paymentId
   * @returns {Promise<Object>}
   */
  async denyPayment(paymentId) {
    console.log(`[YELLOWCARD] Denying payment: ${paymentId}`);
    return await this._request("POST", `/business/payments/${paymentId}/deny`);
  }

  /**
   * Lookup a specific payment by ID.
   * @param {string} paymentId
   * @returns {Promise<Object>} Payment details with status, amounts, etc.
   */
  async getPayment(paymentId) {
    return await this._request("GET", `/business/payments/${paymentId}`);
  }

  /**
   * Lookup a payment by sequenceId (your idempotency key).
   * @param {string} sequenceId
   * @returns {Promise<Object>}
   */
  async getPaymentBySequenceId(sequenceId) {
    return await this._request("GET", `/business/payments/sequence/${sequenceId}`);
  }

  /**
   * Lookup a collection by sequenceId.
   * @param {string} sequenceId
   * @returns {Promise<Object>}
   */
  async getCollectionBySequenceId(sequenceId) {
    return await this._request("GET", `/business/collections/sequence/${sequenceId}`);
  }

  /**
   * List all payments.
   * @param {Object} [params]
   * @returns {Promise<Array>}
   */
  async listPayments(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const path = queryString ? `/business/payments?${queryString}` : "/business/payments";
    return await this._request("GET", path);
  }

  // ═══════════════════════════════════════════════════════════
  // WEBHOOK VERIFICATION
  // ═══════════════════════════════════════════════════════════

  /**
   * Verify the signature of an incoming webhook from Yellow Card.
   * @param {string|Buffer} rawBody - Raw request body
   * @param {string} signature - Value of X-YC-Signature header
   * @returns {boolean} True if signature is valid
   */
  verifyWebhookSignature(rawBody, signature) {
    const bodyString = typeof rawBody === "string" ? rawBody : rawBody.toString("utf8");
    const expectedSig = crypto
      .createHmac("sha256", this.secretKey)
      .update(bodyString)
      .digest("base64");
    return expectedSig === signature;
  }

  // ═══════════════════════════════════════════════════════════
  // HELPERS
  // ═══════════════════════════════════════════════════════════

  /**
   * Find the bank transfer channel for Nigeria.
   * @returns {Promise<Object>} The bank transfer channel with id, limits, etc.
   */
  async getNigeriaBankChannel() {
    const channels = await this.getChannels("NG");
    const bankChannel = channels.find(
      (ch) => ch.paymentType === "bank" || ch.name?.toLowerCase().includes("bank")
    );
    if (!bankChannel) {
      throw new Error("Bank transfer channel not available for Nigeria");
    }
    return bankChannel;
  }

  /**
   * Find a specific bank network by name or code.
   * @param {string} bankNameOrCode - e.g. "GTBank", "058"
   * @returns {Promise<Object>} Network object with id
   */
  async findBankNetwork(bankNameOrCode) {
    const networks = await this.getNetworks("NG");
    const bankNetworks = networks.filter((n) => n.type === "bank");
    const match = bankNetworks.find(
      (n) =>
        n.name?.toLowerCase().includes(bankNameOrCode.toLowerCase()) ||
        n.code === bankNameOrCode
    );
    if (!match) {
      throw new Error(`Bank network not found for: ${bankNameOrCode}`);
    }
    return match;
  }

  _handleError(context, error) {
    const data = error.response?.data;
    const status = error.response?.status;
    const msg = data?.message || data?.error || data || error.message;
    console.error(`[YELLOWCARD] Error in ${context} (HTTP ${status}):`, msg);
    throw new Error(
      `YellowCard ${context} failed: ${typeof msg === "object" ? JSON.stringify(msg) : msg}`
    );
  }
}

module.exports = { YellowCardClient };
