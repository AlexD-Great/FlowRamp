const axios = require("axios");
const crypto = require("crypto");

const BYBIT_BASE_URL = process.env.BYBIT_BASE_URL || "https://api.bybit.com";
const RECV_WINDOW = "20000";

/**
 * Bybit V5 API Client
 * Handles USDT deposit monitoring, FLOW/USDT spot trading, and FLOW withdrawals.
 * Docs: https://bybit-exchange.github.io/docs/v5/intro
 */
class BybitClient {
  constructor() {
    this.apiKey = process.env.BYBIT_API_KEY;
    this.apiSecret = process.env.BYBIT_API_SECRET;
    if (!this.apiKey || !this.apiSecret) {
      console.warn("[BYBIT] WARNING: BYBIT_API_KEY or BYBIT_API_SECRET not set in environment");
    }
    this.httpClient = axios.create({
      baseURL: BYBIT_BASE_URL,
      timeout: 30000,
    });
  }

  // ─── Auth / Signature ──────────────────────────────────────

  /**
   * Generate HMAC-SHA256 signature for Bybit V5 API.
   * @param {string} timestamp
   * @param {string} queryOrBody - Query string (GET) or JSON body (POST)
   * @returns {string} Hex signature
   */
  _sign(timestamp, queryOrBody) {
    const preSign = timestamp + this.apiKey + RECV_WINDOW + queryOrBody;
    return crypto.createHmac("sha256", this.apiSecret).update(preSign).digest("hex");
  }

  /**
   * Build authenticated headers for a request.
   * @param {string} queryOrBody
   * @returns {Object} Headers object
   */
  _authHeaders(queryOrBody = "") {
    const timestamp = Date.now().toString();
    const signature = this._sign(timestamp, queryOrBody);
    return {
      "X-BAPI-API-KEY": this.apiKey,
      "X-BAPI-SIGN": signature,
      "X-BAPI-TIMESTAMP": timestamp,
      "X-BAPI-RECV-WINDOW": RECV_WINDOW,
      "Content-Type": "application/json",
    };
  }

  /**
   * Make an authenticated GET request.
   * @param {string} path - API path
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} Response data
   */
  async _get(path, params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const headers = this._authHeaders(queryString);
    const url = queryString ? `${path}?${queryString}` : path;
    const response = await this.httpClient.get(url, { headers });
    this._checkResponse(response.data, path);
    return response.data.result;
  }

  /**
   * Make an authenticated POST request.
   * @param {string} path - API path
   * @param {Object} body - Request body
   * @returns {Promise<Object>} Response data
   */
  async _post(path, body = {}) {
    const bodyStr = JSON.stringify(body);
    const headers = this._authHeaders(bodyStr);
    const response = await this.httpClient.post(path, body, { headers });
    this._checkResponse(response.data, path);
    return response.data.result;
  }

  /**
   * Make an unauthenticated GET request (for public endpoints).
   * @param {string} path
   * @param {Object} params
   * @returns {Promise<Object>}
   */
  async _publicGet(path, params = {}) {
    const response = await this.httpClient.get(path, { params });
    this._checkResponse(response.data, path);
    return response.data.result;
  }

  _checkResponse(data, path) {
    if (data.retCode !== 0) {
      const msg = `Bybit API error on ${path}: [${data.retCode}] ${data.retMsg}`;
      console.error(`[BYBIT] ${msg}`);
      throw new Error(msg);
    }
  }

  // ─── Market Data (Public) ──────────────────────────────────

  /**
   * Get the current FLOW/USDT ticker price.
   * @returns {Promise<{lastPrice: number, bid: number, ask: number, volume24h: number}>}
   */
  async getFLOWUSDTPrice() {
    try {
      const result = await this._publicGet("/v5/market/tickers", {
        category: "spot",
        symbol: "FLOWUSDT",
      });
      const ticker = result.list[0];
      return {
        lastPrice: parseFloat(ticker.lastPrice),
        bid: parseFloat(ticker.bid1Price),
        ask: parseFloat(ticker.ask1Price),
        volume24h: parseFloat(ticker.volume24h),
        turnover24h: parseFloat(ticker.turnover24h),
      };
    } catch (error) {
      this._handleError("getFLOWUSDTPrice", error);
    }
  }

  // ─── Account & Balance ─────────────────────────────────────

  /**
   * Get wallet balance for a specific coin.
   * @param {string} coin - e.g. "USDT", "FLOW"
   * @param {string} accountType - "UNIFIED" or "SPOT"
   * @returns {Promise<Object>} Balance info
   */
  async getBalance(coin, accountType = "UNIFIED") {
    try {
      const result = await this._get("/v5/account/wallet-balance", {
        accountType,
        coin,
      });
      const account = result.list[0];
      if (!account) return { available: 0, total: 0 };

      const coinData = account.coin.find((c) => c.coin === coin);
      if (!coinData) return { available: 0, total: 0 };

      return {
        available: parseFloat(coinData.availableToWithdraw || coinData.free || 0),
        total: parseFloat(coinData.walletBalance || 0),
        frozen: parseFloat(coinData.locked || 0),
      };
    } catch (error) {
      this._handleError(`getBalance(${coin})`, error);
    }
  }

  // ─── Deposit Monitoring ────────────────────────────────────

  /**
   * Get USDT deposit address for a specific network.
   * @param {string} network - e.g. "TRX" (Tron/TRC-20)
   * @returns {Promise<Object>} Deposit address info
   */
  async getDepositAddress(coin = "USDT", network = "TRX") {
    try {
      const result = await this._get("/v5/asset/deposit/query-address", {
        coin,
        chainType: network,
      });
      return {
        address: result.chains[0]?.addressDeposit,
        chain: result.chains[0]?.chain,
        tag: result.chains[0]?.tagDeposit || null,
      };
    } catch (error) {
      this._handleError("getDepositAddress", error);
    }
  }

  /**
   * Query deposit records to detect incoming USDT.
   * @param {string} coin - e.g. "USDT"
   * @param {number} startTime - Start timestamp in ms (optional)
   * @param {number} limit - Number of records (default 20)
   * @returns {Promise<Array>} Deposit records
   */
  async getDepositRecords(coin = "USDT", startTime = null, limit = 20) {
    try {
      const params = { coin, limit };
      if (startTime) params.startTime = startTime.toString();
      const result = await this._get("/v5/asset/deposit/query-record", params);
      return result.rows || [];
    } catch (error) {
      this._handleError("getDepositRecords", error);
    }
  }

  /**
   * Find a specific USDT deposit by amount and time window.
   * @param {number} expectedAmount - Expected USDT amount
   * @param {Date} afterTimestamp - Only look at deposits after this time
   * @returns {Promise<Object|null>} Matching deposit or null
   */
  async findUSDTDeposit(expectedAmount, afterTimestamp) {
    try {
      const records = await this.getDepositRecords("USDT", afterTimestamp.getTime());

      const match = records.find((rec) => {
        const amount = parseFloat(rec.amount);
        const amountMatch = Math.abs(amount - expectedAmount) < 0.5; // $0.50 tolerance
        const isConfirmed = rec.status === 1; // 1 = success
        return amountMatch && isConfirmed;
      });

      return match || null;
    } catch (error) {
      this._handleError("findUSDTDeposit", error);
      return null;
    }
  }

  // ─── Spot Trading ──────────────────────────────────────────

  /**
   * Place a spot market buy order for FLOW using USDT.
   * @param {number} usdtAmount - Amount of USDT to spend on FLOW
   * @returns {Promise<Object>} Order result
   */
  async buyFLOWWithUSDT(usdtAmount) {
    try {
      console.log(`[BYBIT] Placing market buy for FLOW with ${usdtAmount} USDT`);
      const result = await this._post("/v5/order/create", {
        category: "spot",
        symbol: "FLOWUSDT",
        side: "Buy",
        orderType: "Market",
        qty: usdtAmount.toString(),
        marketUnit: "quoteCoin", // Spend exact USDT amount
      });
      console.log(`[BYBIT] Buy order placed: orderId=${result.orderId}`);
      return {
        orderId: result.orderId,
        orderLinkId: result.orderLinkId,
      };
    } catch (error) {
      this._handleError("buyFLOWWithUSDT", error);
    }
  }

  /**
   * Place a spot market sell order for FLOW to receive USDT.
   * @param {number} flowAmount - Amount of FLOW to sell
   * @returns {Promise<Object>} Order result
   */
  async sellFLOWForUSDT(flowAmount) {
    try {
      console.log(`[BYBIT] Placing market sell for ${flowAmount} FLOW`);
      const result = await this._post("/v5/order/create", {
        category: "spot",
        symbol: "FLOWUSDT",
        side: "Sell",
        orderType: "Market",
        qty: flowAmount.toString(),
        marketUnit: "baseCoin",
      });
      console.log(`[BYBIT] Sell order placed: orderId=${result.orderId}`);
      return {
        orderId: result.orderId,
        orderLinkId: result.orderLinkId,
      };
    } catch (error) {
      this._handleError("sellFLOWForUSDT", error);
    }
  }

  /**
   * Get order details by order ID.
   * @param {string} orderId
   * @returns {Promise<Object>} Order details
   */
  async getOrder(orderId) {
    try {
      const result = await this._get("/v5/order/realtime", {
        category: "spot",
        orderId,
      });
      return result.list[0] || null;
    } catch (error) {
      this._handleError(`getOrder(${orderId})`, error);
    }
  }

  /**
   * Wait for an order to be fully filled.
   * @param {string} orderId
   * @param {number} maxWaitMs
   * @param {number} pollIntervalMs
   * @returns {Promise<Object>} Filled order details
   */
  async waitForOrderFill(orderId, maxWaitMs = 60000, pollIntervalMs = 2000) {
    const startTime = Date.now();
    while (Date.now() - startTime < maxWaitMs) {
      const order = await this.getOrder(orderId);
      if (!order) {
        await this._sleep(pollIntervalMs);
        continue;
      }
      if (order.orderStatus === "Filled") {
        console.log(`[BYBIT] Order ${orderId} filled. Qty: ${order.cumExecQty}, Value: ${order.cumExecValue}`);
        return {
          orderId: order.orderId,
          status: order.orderStatus,
          filledQty: parseFloat(order.cumExecQty),
          filledValue: parseFloat(order.cumExecValue),
          avgPrice: parseFloat(order.avgPrice),
          side: order.side,
        };
      }
      if (order.orderStatus === "Cancelled" || order.orderStatus === "Rejected") {
        throw new Error(`Order ${orderId} was ${order.orderStatus}: ${order.rejectReason || "unknown"}`);
      }
      await this._sleep(pollIntervalMs);
    }
    throw new Error(`Order ${orderId} not filled within ${maxWaitMs / 1000}s`);
  }

  // ─── Withdrawals ───────────────────────────────────────────

  /**
   * Withdraw FLOW tokens to an external Flow blockchain address.
   * @param {number} amount - FLOW amount
   * @param {string} address - Flow blockchain address (e.g. 0x...)
   * @returns {Promise<Object>} Withdrawal result
   */
  async withdrawFLOW(amount, address) {
    try {
      console.log(`[BYBIT] Withdrawing ${amount} FLOW to ${address}`);
      const result = await this._post("/v5/asset/withdraw/create", {
        coin: "FLOW",
        chain: "FLOW", // Flow blockchain native
        address: address,
        amount: amount.toString(),
        timestamp: Date.now(),
        forceChain: 1, // Use the specified chain
        accountType: "FUND",
      });
      console.log(`[BYBIT] FLOW withdrawal created: id=${result.id}`);
      return {
        withdrawId: result.id,
      };
    } catch (error) {
      this._handleError("withdrawFLOW", error);
    }
  }

  /**
   * Withdraw USDT to an external address (e.g. back to Quidax via TRC-20).
   * @param {number} amount - USDT amount
   * @param {string} address - TRC-20 address
   * @returns {Promise<Object>} Withdrawal result
   */
  async withdrawUSDT(amount, address) {
    try {
      console.log(`[BYBIT] Withdrawing ${amount} USDT (TRC-20) to ${address}`);
      const result = await this._post("/v5/asset/withdraw/create", {
        coin: "USDT",
        chain: "TRX", // TRC-20 for fast/cheap transfer
        address: address,
        amount: amount.toString(),
        timestamp: Date.now(),
        forceChain: 1,
        accountType: "FUND",
      });
      console.log(`[BYBIT] USDT withdrawal created: id=${result.id}`);
      return {
        withdrawId: result.id,
      };
    } catch (error) {
      this._handleError("withdrawUSDT", error);
    }
  }

  /**
   * Get withdrawal record by ID.
   * @param {string} withdrawId
   * @returns {Promise<Object>} Withdrawal record
   */
  async getWithdrawalRecord(withdrawId) {
    try {
      const result = await this._get("/v5/asset/withdraw/query-record", {
        withdrawID: withdrawId,
      });
      return result.rows[0] || null;
    } catch (error) {
      this._handleError(`getWithdrawalRecord(${withdrawId})`, error);
    }
  }

  /**
   * Wait for a withdrawal to be confirmed.
   * @param {string} withdrawId
   * @param {number} maxWaitMs - Default 10 minutes
   * @param {number} pollIntervalMs - Default 15 seconds
   * @returns {Promise<Object>} Confirmed withdrawal
   */
  async waitForWithdrawal(withdrawId, maxWaitMs = 600000, pollIntervalMs = 15000) {
    const startTime = Date.now();
    while (Date.now() - startTime < maxWaitMs) {
      const record = await this.getWithdrawalRecord(withdrawId);
      if (!record) {
        await this._sleep(pollIntervalMs);
        continue;
      }
      // Bybit withdrawal statuses: 0=pending, 1=pending, 2=success, 3=failed
      if (record.status === "2" || record.status === 2) {
        console.log(`[BYBIT] Withdrawal ${withdrawId} confirmed. TxID: ${record.txID}`);
        return {
          withdrawId: record.withdrawId,
          status: "success",
          txId: record.txID,
          amount: record.amount,
          fee: record.withdrawFee,
        };
      }
      if (record.status === "3" || record.status === 3) {
        throw new Error(`Withdrawal ${withdrawId} failed`);
      }
      console.log(`[BYBIT] Withdrawal ${withdrawId} still pending (status: ${record.status})...`);
      await this._sleep(pollIntervalMs);
    }
    throw new Error(`Withdrawal ${withdrawId} not confirmed within ${maxWaitMs / 1000}s`);
  }

  /**
   * Transfer funds between Bybit account types (e.g. FUND → UNIFIED for trading).
   * @param {string} coin
   * @param {number} amount
   * @param {string} fromAccountType - e.g. "FUND"
   * @param {string} toAccountType - e.g. "UNIFIED"
   * @returns {Promise<Object>}
   */
  async internalTransfer(coin, amount, fromAccountType = "FUND", toAccountType = "UNIFIED") {
    try {
      const transferId = crypto.randomUUID();
      console.log(`[BYBIT] Internal transfer: ${amount} ${coin} from ${fromAccountType} → ${toAccountType}`);
      const result = await this._post("/v5/asset/transfer/inter-transfer", {
        transferId,
        coin,
        amount: amount.toString(),
        fromAccountType,
        toAccountType,
      });
      console.log(`[BYBIT] Internal transfer done: ${result.transferId}`);
      return { transferId: result.transferId };
    } catch (error) {
      this._handleError("internalTransfer", error);
    }
  }

  // ─── Internal Helpers ──────────────────────────────────────

  _handleError(method, error) {
    if (error.message && error.message.startsWith("Bybit API error")) {
      throw error; // Already formatted
    }
    const msg = error.response?.data?.retMsg || error.response?.data || error.message;
    console.error(`[BYBIT] Error in ${method}:`, msg);
    throw new Error(`Bybit ${method} failed: ${typeof msg === "object" ? JSON.stringify(msg) : msg}`);
  }

  _sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

module.exports = { BybitClient };
