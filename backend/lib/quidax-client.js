const axios = require("axios");
const crypto = require("crypto");

const QUIDAX_BASE_URL = "https://www.quidax.com/api/v1";

/**
 * Quidax API Client
 * Handles NGN deposits, USDT/NGN trading, and USDT withdrawals.
 * Docs: https://docs.quidax.com
 */
class QuidaxClient {
  constructor() {
    this.apiSecret = process.env.QUIDAX_API_SECRET;
    if (!this.apiSecret) {
      console.warn("[QUIDAX] WARNING: QUIDAX_API_SECRET not set in environment");
    }
    this.httpClient = axios.create({
      baseURL: QUIDAX_BASE_URL,
      headers: {
        Authorization: `Bearer ${this.apiSecret}`,
        "Content-Type": "application/json",
      },
      timeout: 30000,
    });
  }

  // ─── Account & Wallets ─────────────────────────────────────

  /**
   * Get all wallet balances for the authenticated user.
   * @returns {Promise<Array>} Array of wallet objects with currency, balance, etc.
   */
  async getWallets() {
    try {
      const response = await this.httpClient.get("/users/me/wallets");
      return response.data.data;
    } catch (error) {
      this._handleError("getWallets", error);
    }
  }

  /**
   * Get wallet details for a specific currency.
   * @param {string} currency - e.g. "ngn", "usdt"
   * @returns {Promise<Object>} Wallet object
   */
  async getWallet(currency) {
    try {
      const response = await this.httpClient.get(`/users/me/wallets/${currency.toLowerCase()}`);
      return response.data.data;
    } catch (error) {
      this._handleError(`getWallet(${currency})`, error);
    }
  }

  /**
   * Get the NGN deposit details (virtual bank account).
   * Users will transfer NGN to this account.
   * @returns {Promise<Object>} Deposit details with bank name, account number, etc.
   */
  async getNGNDepositDetails() {
    try {
      const wallet = await this.getWallet("ngn");
      return {
        currency: "NGN",
        balance: parseFloat(wallet.balance),
        depositDetails: wallet.deposit_details || null,
      };
    } catch (error) {
      this._handleError("getNGNDepositDetails", error);
    }
  }

  /**
   * Get deposit address for a crypto currency (e.g. USDT TRC-20).
   * @param {string} currency - e.g. "usdt"
   * @param {string} network - e.g. "trc20" (optional, defaults depend on exchange)
   * @returns {Promise<Object>} Address details
   */
  async getCryptoDepositAddress(currency, network = null) {
    try {
      const url = `/users/me/wallets/${currency.toLowerCase()}/address`;
      const params = network ? { network } : {};
      const response = await this.httpClient.get(url, { params });
      return response.data.data;
    } catch (error) {
      this._handleError(`getCryptoDepositAddress(${currency})`, error);
    }
  }

  // ─── Deposits Monitoring ───────────────────────────────────

  /**
   * List recent deposits for a currency.
   * Used to monitor incoming NGN deposits from users.
   * @param {string} currency - e.g. "ngn", "usdt"
   * @param {string} state - e.g. "done", "pending" (optional)
   * @returns {Promise<Array>} Array of deposit records
   */
  async getDeposits(currency = null, state = null) {
    try {
      const params = {};
      if (currency) params.currency = currency.toLowerCase();
      if (state) params.state = state;
      const response = await this.httpClient.get("/users/me/deposits", { params });
      return response.data.data;
    } catch (error) {
      this._handleError("getDeposits", error);
    }
  }

  /**
   * Check for a specific NGN deposit by amount and reference/time window.
   * @param {number} expectedAmount - Expected NGN amount
   * @param {Date} afterTimestamp - Only look at deposits after this time
   * @returns {Promise<Object|null>} Matching deposit or null
   */
  async findNGNDeposit(expectedAmount, afterTimestamp) {
    try {
      const deposits = await this.getDeposits("ngn", "done");
      if (!deposits || !Array.isArray(deposits)) return null;

      const match = deposits.find((dep) => {
        const depAmount = parseFloat(dep.amount);
        const depTime = new Date(dep.created_at);
        const amountMatch = Math.abs(depAmount - expectedAmount) < 1; // Allow ₦1 tolerance
        const timeMatch = depTime >= afterTimestamp;
        return amountMatch && timeMatch;
      });

      return match || null;
    } catch (error) {
      this._handleError("findNGNDeposit", error);
      return null;
    }
  }

  // ─── Trading ───────────────────────────────────────────────

  /**
   * Get the current ticker for a market pair.
   * @param {string} market - e.g. "usdtngn"
   * @returns {Promise<Object>} Ticker with buy/sell prices, volume, etc.
   */
  async getTicker(market) {
    try {
      const response = await this.httpClient.get(`/markets/tickers/${market.toLowerCase()}`);
      return response.data.data;
    } catch (error) {
      this._handleError(`getTicker(${market})`, error);
    }
  }

  /**
   * Get USDT/NGN current price.
   * @returns {Promise<{buy: number, sell: number, last: number}>}
   */
  async getUSDTNGNPrice() {
    try {
      const ticker = await this.getTicker("usdtngn");
      return {
        buy: parseFloat(ticker.ticker.buy),   // Price to buy USDT (pay NGN)
        sell: parseFloat(ticker.ticker.sell),  // Price to sell USDT (receive NGN)
        last: parseFloat(ticker.ticker.last),
      };
    } catch (error) {
      this._handleError("getUSDTNGNPrice", error);
    }
  }

  /**
   * Place a market order on Quidax.
   * @param {string} market - e.g. "usdtngn"
   * @param {string} side - "buy" or "sell"
   * @param {number} volume - Amount of base currency (USDT) to buy/sell
   * @returns {Promise<Object>} Order result
   */
  async placeMarketOrder(market, side, volume) {
    try {
      console.log(`[QUIDAX] Placing ${side} market order: ${volume} on ${market}`);
      const response = await this.httpClient.post("/users/me/orders", {
        market: market.toLowerCase(),
        side,
        ord_type: "market",
        volume: volume.toString(),
      });
      const order = response.data.data;
      console.log(`[QUIDAX] Order placed: ID=${order.id}, state=${order.state}`);
      return order;
    } catch (error) {
      this._handleError(`placeMarketOrder(${market}, ${side})`, error);
    }
  }

  /**
   * Buy USDT with NGN using a market order.
   * @param {number} ngnAmount - Amount of NGN to spend
   * @returns {Promise<Object>} Order result with USDT amount received
   */
  async buyUSDTWithNGN(ngnAmount) {
    try {
      // Get current USDT/NGN price to calculate volume
      const price = await this.getUSDTNGNPrice();
      const usdtVolume = (ngnAmount / price.buy).toFixed(2);

      console.log(`[QUIDAX] Buying ~${usdtVolume} USDT with ₦${ngnAmount} (rate: ₦${price.buy}/USDT)`);

      const order = await this.placeMarketOrder("usdtngn", "buy", usdtVolume);
      return {
        orderId: order.id,
        state: order.state,
        estimatedUSDT: parseFloat(usdtVolume),
        ngnSpent: ngnAmount,
        rate: price.buy,
        order,
      };
    } catch (error) {
      this._handleError("buyUSDTWithNGN", error);
    }
  }

  /**
   * Sell USDT for NGN using a market order.
   * @param {number} usdtAmount - Amount of USDT to sell
   * @returns {Promise<Object>} Order result with NGN amount received
   */
  async sellUSDTForNGN(usdtAmount) {
    try {
      const price = await this.getUSDTNGNPrice();
      const estimatedNGN = (usdtAmount * price.sell).toFixed(2);

      console.log(`[QUIDAX] Selling ${usdtAmount} USDT for ~₦${estimatedNGN} (rate: ₦${price.sell}/USDT)`);

      const order = await this.placeMarketOrder("usdtngn", "sell", usdtAmount.toString());
      return {
        orderId: order.id,
        state: order.state,
        usdtSold: usdtAmount,
        estimatedNGN: parseFloat(estimatedNGN),
        rate: price.sell,
        order,
      };
    } catch (error) {
      this._handleError("sellUSDTForNGN", error);
    }
  }

  /**
   * Get order status by ID.
   * @param {string} orderId
   * @returns {Promise<Object>} Order details
   */
  async getOrder(orderId) {
    try {
      const response = await this.httpClient.get(`/users/me/orders/${orderId}`);
      return response.data.data;
    } catch (error) {
      this._handleError(`getOrder(${orderId})`, error);
    }
  }

  /**
   * Wait for an order to be fully filled.
   * @param {string} orderId
   * @param {number} maxWaitMs - Maximum time to wait (default 60s)
   * @param {number} pollIntervalMs - Poll interval (default 3s)
   * @returns {Promise<Object>} Completed order
   */
  async waitForOrderFill(orderId, maxWaitMs = 60000, pollIntervalMs = 3000) {
    const startTime = Date.now();
    while (Date.now() - startTime < maxWaitMs) {
      const order = await this.getOrder(orderId);
      if (order.state === "done") {
        console.log(`[QUIDAX] Order ${orderId} filled. Executed volume: ${order.executed_volume}`);
        return order;
      }
      if (order.state === "cancel" || order.state === "rejected") {
        throw new Error(`Order ${orderId} was ${order.state}`);
      }
      await this._sleep(pollIntervalMs);
    }
    throw new Error(`Order ${orderId} not filled within ${maxWaitMs / 1000}s`);
  }

  // ─── Withdrawals ───────────────────────────────────────────

  /**
   * Withdraw USDT to an external address (e.g. Bybit TRC-20 address).
   * @param {number} amount - USDT amount
   * @param {string} address - Destination address
   * @param {string} network - Network to use, e.g. "trc20"
   * @returns {Promise<Object>} Withdrawal result
   */
  async withdrawUSDT(amount, address, network = "trc20") {
    try {
      console.log(`[QUIDAX] Withdrawing ${amount} USDT to ${address} via ${network}`);
      const response = await this.httpClient.post("/users/me/withdraws", {
        currency: "usdt",
        amount: amount.toString(),
        fund_uid: address,
        network,
      });
      const withdrawal = response.data.data;
      console.log(`[QUIDAX] Withdrawal created: ID=${withdrawal.id}, state=${withdrawal.state}`);
      return withdrawal;
    } catch (error) {
      this._handleError("withdrawUSDT", error);
    }
  }

  /**
   * Withdraw NGN to a bank account.
   * @param {number} amount - NGN amount
   * @param {Object} bankDetails - { account_number, bank_code, account_name }
   * @returns {Promise<Object>} Withdrawal result
   */
  async withdrawNGN(amount, bankDetails) {
    try {
      console.log(`[QUIDAX] Withdrawing ₦${amount} to bank: ${bankDetails.account_number}`);
      const response = await this.httpClient.post("/users/me/withdraws", {
        currency: "ngn",
        amount: amount.toString(),
        fund_uid: bankDetails.account_number,
        bank_code: bankDetails.bank_code,
        account_name: bankDetails.account_name,
      });
      const withdrawal = response.data.data;
      console.log(`[QUIDAX] NGN Withdrawal created: ID=${withdrawal.id}`);
      return withdrawal;
    } catch (error) {
      this._handleError("withdrawNGN", error);
    }
  }

  /**
   * Get withdrawal status.
   * @param {string} withdrawalId
   * @returns {Promise<Object>} Withdrawal details
   */
  async getWithdrawal(withdrawalId) {
    try {
      const response = await this.httpClient.get(`/users/me/withdraws/${withdrawalId}`);
      return response.data.data;
    } catch (error) {
      this._handleError(`getWithdrawal(${withdrawalId})`, error);
    }
  }

  // ─── Internal Helpers ──────────────────────────────────────

  _handleError(method, error) {
    const msg = error.response?.data?.message || error.response?.data || error.message;
    console.error(`[QUIDAX] Error in ${method}:`, msg);
    throw new Error(`Quidax ${method} failed: ${typeof msg === "object" ? JSON.stringify(msg) : msg}`);
  }

  _sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

module.exports = { QuidaxClient };
