const { YellowCardClient } = require("./yellowcard-client");
const { BybitClient } = require("./bybit-client");

/**
 * Rate Provider
 * Fetches live exchange rates from Yellow Card (NGN/USD) and Bybit (FLOW/USDT)
 * and computes the effective FLOW/NGN rate for the user.
 */
class RateProvider {
  constructor() {
    this.yellowCard = new YellowCardClient();
    this.bybit = new BybitClient();

    // Cache rates for a short period to avoid excessive API calls
    this._cache = {};
    this._cacheTTL = 15000; // 15 seconds
  }

  /**
   * Get the current USD/NGN rate from Yellow Card.
   * @returns {Promise<{buy: number, sell: number}>}
   *   buy  = NGN per 1 USD (collection rate: user pays NGN, you get USD float)
   *   sell = NGN per 1 USD (payment rate: you spend USD float, user gets NGN)
   */
  async getUSDTNGNRate() {
    return this._cached("usdt_ngn", async () => {
      const rate = await this.yellowCard.getNGNRate();
      return { buy: rate.buy, sell: rate.sell };
    });
  }

  /**
   * Get the current FLOW/USDT rate from Bybit.
   * @returns {Promise<{lastPrice: number, bid: number, ask: number}>}
   */
  async getFLOWUSDTRate() {
    return this._cached("flow_usdt", async () => {
      return await this.bybit.getFLOWUSDTPrice();
    });
  }

  /**
   * Get the full FLOW/NGN rate for buying FLOW with NGN.
   * Combines Yellow Card USD/NGN collection rate × Bybit FLOW/USDT ask price.
   * 
   * @returns {Promise<Object>} Rate breakdown:
   *   flowNGNRate  = how many NGN for 1 FLOW
   *   usdtNGNRate  = how many NGN for 1 USDT (Quidax buy price)
   *   flowUSDTRate = how many USDT for 1 FLOW (Bybit ask price)
   */
  async getBuyRate() {
    const [usdtNgn, flowUsdt] = await Promise.all([
      this.getUSDTNGNRate(),
      this.getFLOWUSDTRate(),
    ]);

    // Buying FLOW: user pays NGN (YC collection) → USD float → buy FLOW at Bybit ask
    const flowNGNRate = flowUsdt.ask * usdtNgn.buy;

    return {
      flowNGNRate,
      usdtNGNRate: usdtNgn.buy,
      flowUSDTRate: flowUsdt.ask,
      direction: "buy",
    };
  }

  /**
   * Get the full FLOW/NGN rate for selling FLOW for NGN.
   * Combines Bybit FLOW/USDT bid price × Yellow Card USD/NGN payment rate.
   * 
   * @returns {Promise<Object>} Rate breakdown
   */
  async getSellRate() {
    const [usdtNgn, flowUsdt] = await Promise.all([
      this.getUSDTNGNRate(),
      this.getFLOWUSDTRate(),
    ]);

    // Selling FLOW: sell FLOW at Bybit bid → USD float → YC payment to user's bank (NGN)
    const flowNGNRate = flowUsdt.bid * usdtNgn.sell;

    return {
      flowNGNRate,
      usdtNGNRate: usdtNgn.sell,
      flowUSDTRate: flowUsdt.bid,
      direction: "sell",
    };
  }

  /**
   * Calculate how much FLOW a user gets for a given NGN amount (buy).
   * @param {number} ngnAmount - Amount of NGN the user is spending
   * @param {number} feePercent - Platform fee percentage (e.g. 0.015 for 1.5%)
   * @returns {Promise<Object>} Breakdown of the conversion
   */
  async calculateBuy(ngnAmount, feePercent = 0.015) {
    const rate = await this.getBuyRate();
    const platformFeeNGN = ngnAmount * feePercent;
    const netNGN = ngnAmount - platformFeeNGN;
    const usdtAmount = netNGN / rate.usdtNGNRate;
    const flowAmount = usdtAmount / rate.flowUSDTRate;

    return {
      inputNGN: ngnAmount,
      platformFeeNGN,
      netNGN,
      usdtAmount: parseFloat(usdtAmount.toFixed(2)),
      flowAmount: parseFloat(flowAmount.toFixed(4)),
      rates: rate,
      feePercent,
    };
  }

  /**
   * Calculate how much NGN a user gets for selling FLOW (sell).
   * @param {number} flowAmount - Amount of FLOW the user is selling
   * @param {number} feePercent - Platform fee percentage
   * @returns {Promise<Object>} Breakdown of the conversion
   */
  async calculateSell(flowAmount, feePercent = 0.015) {
    const rate = await this.getSellRate();
    const usdtAmount = flowAmount * rate.flowUSDTRate;
    const grossNGN = usdtAmount * rate.usdtNGNRate;
    const platformFeeNGN = grossNGN * feePercent;
    const netNGN = grossNGN - platformFeeNGN;

    return {
      inputFLOW: flowAmount,
      usdtAmount: parseFloat(usdtAmount.toFixed(2)),
      grossNGN: parseFloat(grossNGN.toFixed(2)),
      platformFeeNGN: parseFloat(platformFeeNGN.toFixed(2)),
      netNGN: parseFloat(netNGN.toFixed(2)),
      rates: rate,
      feePercent,
    };
  }

  // ─── Cache Helpers ─────────────────────────────────────────

  async _cached(key, fetchFn) {
    const now = Date.now();
    if (this._cache[key] && now - this._cache[key].timestamp < this._cacheTTL) {
      return this._cache[key].data;
    }
    const data = await fetchFn();
    this._cache[key] = { data, timestamp: now };
    return data;
  }

  clearCache() {
    this._cache = {};
  }
}

module.exports = { RateProvider };
