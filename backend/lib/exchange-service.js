const { YellowCardClient } = require("./yellowcard-client");
const { BybitClient } = require("./bybit-client");
const { RateProvider } = require("./rate-provider");
const { updateDocument, getDocument } = require("./firebase-admin");

/**
 * Exchange Service — Full Pipeline Orchestrator
 * 
 * Uses Yellow Card for NGN fiat rails and Bybit for FLOW/USDT trading.
 * No cross-exchange USDT transfers needed per transaction — much faster.
 * 
 * BUY FLOW (On-ramp):
 *   User pays NGN → Yellow Card collection credits USD float
 *   → Buy FLOW/USDT on Bybit (pre-funded USDT) → Withdraw FLOW to user wallet
 * 
 * SELL FLOW (Off-ramp):
 *   FLOW deposited on Bybit → Sell FLOW/USDT on Bybit
 *   → Yellow Card payment sends NGN to user's bank (debits USD float)
 * 
 * Operator keeps balances on both Yellow Card (USD float) and Bybit (USDT).
 * Periodic rebalancing moves funds between the two as needed.
 */
class ExchangeService {
  constructor() {
    this.yellowCard = new YellowCardClient();
    this.bybit = new BybitClient();
    this.rateProvider = new RateProvider();

    // Cached addresses / channel info
    this._bybitFLOWAddress = null;
    this._ngBankChannelId = null;
  }

  // ═══════════════════════════════════════════════════════════
  // BUY FLOW PIPELINE (NGN → FLOW)
  // ═══════════════════════════════════════════════════════════

  /**
   * Execute the full buy pipeline for an on-ramp session.
   * 
   * Triggered when Yellow Card webhook confirms NGN collection is complete.
   * At that point, USD float is credited. We then:
   *   1. Buy FLOW with USDT on Bybit (operator's pre-funded balance)
   *   2. Withdraw FLOW to the user's Flow wallet
   * 
   * @param {string} sessionId - Firestore on-ramp session ID
   * @param {number} ngnAmount - NGN amount collected
   * @param {string} userFlowAddress - User's Flow wallet address
   * @returns {Promise<Object>} Pipeline result with txHash
   */
  async executeBuyPipeline(sessionId, ngnAmount, userFlowAddress) {
    const log = (step, msg) => console.log(`[BUY-PIPELINE][${sessionId}] Step ${step}: ${msg}`);

    try {
      // Get live rate to calculate how much FLOW to buy
      const quote = await this.rateProvider.calculateBuy(ngnAmount);
      const usdtNeeded = quote.usdtAmount;
      const estimatedFlow = quote.flowAmount;

      log(1, `NGN collected: ₦${ngnAmount} → need ~${usdtNeeded} USDT → ~${estimatedFlow} FLOW`);

      // ── Step 1: Verify Bybit has enough USDT balance ──────
      log(1, "Verifying Bybit USDT balance");
      await this._updateSession(sessionId, {
        pipelineStep: "checking_balance",
        pipelineUpdatedAt: new Date().toISOString(),
      });

      const balance = await this.bybit.getBalance("USDT");
      if (balance.available < usdtNeeded) {
        throw new Error(
          `Insufficient Bybit USDT balance. Needed: ${usdtNeeded}, Available: ${balance.available}. ` +
          `Please top up Bybit USDT balance.`
        );
      }

      // ── Step 2: Buy FLOW with USDT on Bybit ──────────────
      log(2, `Buying FLOW with ~${usdtNeeded} USDT on Bybit`);
      await this._updateSession(sessionId, { pipelineStep: "buying_flow" });

      // Use slightly less to account for trading fees (0.1% taker fee)
      const usdtForTrade = parseFloat((usdtNeeded * 0.998).toFixed(2));
      const buyOrder = await this.bybit.buyFLOWWithUSDT(usdtForTrade);
      const filledBuy = await this.bybit.waitForOrderFill(buyOrder.orderId);

      const flowBought = filledBuy.filledQty;
      log(2, `Bought ${flowBought} FLOW at avg price ${filledBuy.avgPrice} USDT`);
      await this._updateSession(sessionId, {
        pipelineStep: "flow_bought",
        bybitOrderId: buyOrder.orderId,
        flowAmount: flowBought,
        flowAvgPrice: filledBuy.avgPrice,
        usdtSpent: usdtForTrade,
      });

      // ── Step 3: Transfer FLOW to FUND for withdrawal (if needed) ──
      log(3, "Preparing FLOW for withdrawal");
      try {
        await this.bybit.internalTransfer("FLOW", flowBought, "UNIFIED", "FUND");
      } catch (transferErr) {
        log(3, `Internal transfer note: ${transferErr.message} — may already be withdrawable`);
      }

      // ── Step 4: Withdraw FLOW to user's Flow wallet ───────
      log(4, `Withdrawing FLOW to ${userFlowAddress}`);
      await this._updateSession(sessionId, { pipelineStep: "withdrawing_flow" });

      // Account for Bybit FLOW withdrawal fee
      const bybitFlowFee = 0.1;
      const flowToWithdraw = parseFloat((flowBought - bybitFlowFee).toFixed(4));

      if (flowToWithdraw <= 0) {
        throw new Error(`FLOW amount after withdrawal fee too low: ${flowBought} - ${bybitFlowFee}`);
      }

      const flowWithdrawal = await this.bybit.withdrawFLOW(flowToWithdraw, userFlowAddress);
      const confirmedWithdrawal = await this.bybit.waitForWithdrawal(flowWithdrawal.withdrawId);

      log(4, `FLOW withdrawal confirmed! TxID: ${confirmedWithdrawal.txId}`);

      // ── Done ──────────────────────────────────────────────
      await this._updateSession(sessionId, {
        status: "completed",
        pipelineStep: "done",
        flowDelivered: flowToWithdraw,
        bybitWithdrawalId: flowWithdrawal.withdrawId,
        flowTxHash: confirmedWithdrawal.txId,
        completedAt: new Date().toISOString(),
      });

      return {
        success: true,
        flowDelivered: flowToWithdraw,
        txHash: confirmedWithdrawal.txId,
        usdtSpent: usdtForTrade,
        ngnSpent: ngnAmount,
      };

    } catch (error) {
      console.error(`[BUY-PIPELINE][${sessionId}] FAILED:`, error.message);
      await this._updateSession(sessionId, {
        status: "pipeline_failed",
        pipelineStep: "error",
        pipelineError: error.message,
        failedAt: new Date().toISOString(),
      });
      throw error;
    }
  }

  // ═══════════════════════════════════════════════════════════
  // SELL FLOW PIPELINE (FLOW → NGN)
  // ═══════════════════════════════════════════════════════════

  /**
   * Execute the full sell pipeline for an off-ramp request.
   * 
   * Triggered when Bybit FLOW deposit is confirmed:
   *   1. Sell FLOW for USDT on Bybit
   *   2. Create Yellow Card payment to send NGN to user's bank
   * 
   * @param {string} requestId - Firestore off-ramp request ID
   * @param {number} flowAmount - FLOW amount deposited
   * @param {Object} bankDetails - { account_number, bank_code, account_name, networkId }
   * @returns {Promise<Object>} Pipeline result
   */
  async executeSellPipeline(requestId, flowAmount, bankDetails) {
    const log = (step, msg) => console.log(`[SELL-PIPELINE][${requestId}] Step ${step}: ${msg}`);

    try {
      // ── Step 1: Transfer FLOW to trading account (if needed) ──
      log(1, "Preparing FLOW for trading");
      await this._updateRequest(requestId, {
        pipelineStep: "preparing_trade",
        pipelineUpdatedAt: new Date().toISOString(),
      });

      try {
        await this.bybit.internalTransfer("FLOW", flowAmount, "FUND", "UNIFIED");
      } catch (transferErr) {
        log(1, `Internal transfer note: ${transferErr.message}`);
      }

      // ── Step 2: Sell FLOW for USDT on Bybit ──────────────
      log(2, `Selling ${flowAmount} FLOW for USDT on Bybit`);
      await this._updateRequest(requestId, { pipelineStep: "selling_flow" });

      const sellOrder = await this.bybit.sellFLOWForUSDT(flowAmount);
      const filledSell = await this.bybit.waitForOrderFill(sellOrder.orderId);

      const usdtReceived = filledSell.filledValue;
      log(2, `Sold ${flowAmount} FLOW for ${usdtReceived} USDT at avg ${filledSell.avgPrice}`);
      await this._updateRequest(requestId, {
        pipelineStep: "flow_sold",
        bybitOrderId: sellOrder.orderId,
        usdtReceived,
        flowAvgPrice: filledSell.avgPrice,
      });

      // ── Step 3: Create Yellow Card payment (send NGN to user's bank) ──
      log(3, "Creating Yellow Card payment to user's bank");
      await this._updateRequest(requestId, { pipelineStep: "creating_ngn_payment" });

      // Calculate NGN payout amount using the rate
      const sellRate = await this.rateProvider.getSellRate();
      const grossNGN = usdtReceived * sellRate.usdtNGNRate;
      const feePercent = 0.015;
      const platformFee = parseFloat((grossNGN * feePercent).toFixed(2));
      const ngnToSend = parseFloat((grossNGN - platformFee).toFixed(2));

      // Get Nigeria bank channel
      const channelId = await this._getNigeriaBankChannelId();

      // Submit YC payment
      const ycPayment = await this.yellowCard.submitPayment({
        amount: ngnToSend,
        currency: "NGN",
        channelId,
        sequenceId: `offramp-${requestId}`,
        reason: "crypto_sale",
        destination: {
          accountNumber: bankDetails.account_number,
          accountName: bankDetails.account_name,
          accountType: "bank",
          networkId: bankDetails.networkId || bankDetails.bank_code,
        },
        forceAccept: true, // Auto-accept to speed up processing
      });

      log(3, `Yellow Card payment submitted: ${ycPayment.id}, status: ${ycPayment.status}`);
      await this._updateRequest(requestId, {
        pipelineStep: "ngn_payment_submitted",
        ycPaymentId: ycPayment.id,
        ngnAmount: ngnToSend,
        platformFee,
      });

      // If not auto-accepted, accept it now
      if (ycPayment.status === "created" || ycPayment.status === "pending") {
        await this.yellowCard.acceptPayment(ycPayment.id);
        log(3, `Yellow Card payment accepted: ${ycPayment.id}`);
      }

      // ── Done (NGN delivery is confirmed via YC webhook) ───
      await this._updateRequest(requestId, {
        status: "ngn_payout_pending",
        pipelineStep: "awaiting_ngn_delivery",
        ngnSent: ngnToSend,
        platformFee,
        ycPaymentId: ycPayment.id,
      });

      return {
        success: true,
        flowSold: flowAmount,
        usdtReceived,
        ngnSent: ngnToSend,
        platformFee,
        ycPaymentId: ycPayment.id,
      };

    } catch (error) {
      console.error(`[SELL-PIPELINE][${requestId}] FAILED:`, error.message);
      await this._updateRequest(requestId, {
        status: "pipeline_failed",
        pipelineStep: "error",
        pipelineError: error.message,
        failedAt: new Date().toISOString(),
      });
      throw error;
    }
  }

  // ═══════════════════════════════════════════════════════════
  // YELLOW CARD COLLECTION HELPER (on-ramp: collect NGN)
  // ═══════════════════════════════════════════════════════════

  /**
   * Create a Yellow Card collection to collect NGN from the user.
   * Returns bank account details for the user to transfer to.
   * 
   * @param {string} sessionId - On-ramp session ID (used as sequenceId)
   * @param {number} ngnAmount - Amount in NGN to collect
   * @param {Object} [source] - Optional source details (user's bank info)
   * @returns {Promise<Object>} Collection with bank details for user to pay into
   */
  async createNGNCollection(sessionId, ngnAmount, source = null) {
    const channelId = await this._getNigeriaBankChannelId();

    const params = {
      amount: ngnAmount,
      currency: "NGN",
      channelId,
      sequenceId: `onramp-${sessionId}`,
      reason: "crypto_purchase",
    };

    if (source) {
      params.source = source;
    }

    const collection = await this.yellowCard.submitCollection(params);
    console.log(`[EXCHANGE] YC Collection created: ${collection.id} for session ${sessionId}`);

    // Auto-accept the collection
    if (collection.status === "created" || collection.status === "pending") {
      await this.yellowCard.acceptCollection(collection.id);
      console.log(`[EXCHANGE] YC Collection accepted: ${collection.id}`);
    }

    return collection;
  }

  // ═══════════════════════════════════════════════════════════
  // DEPOSIT ADDRESS / INFO HELPERS
  // ═══════════════════════════════════════════════════════════

  /**
   * Get the Bybit FLOW deposit address for off-ramp (sell) orders.
   * @returns {Promise<string>}
   */
  async getBybitFLOWDepositAddress() {
    if (this._bybitFLOWAddress) return this._bybitFLOWAddress;
    const result = await this.bybit.getDepositAddress("FLOW", "FLOW");
    this._bybitFLOWAddress = result.address;
    return this._bybitFLOWAddress;
  }

  /**
   * Get Nigeria bank channel ID from Yellow Card (cached).
   * @returns {Promise<string>}
   */
  async _getNigeriaBankChannelId() {
    if (this._ngBankChannelId) return this._ngBankChannelId;
    const channel = await this.yellowCard.getNigeriaBankChannel();
    this._ngBankChannelId = channel.id;
    return this._ngBankChannelId;
  }

  /**
   * Get available Nigerian banks (for frontend bank selector).
   * @returns {Promise<Array>}
   */
  async getNigerianBankNetworks() {
    return await this.yellowCard.getNetworks("NG");
  }

  // ═══════════════════════════════════════════════════════════
  // FIRESTORE HELPERS
  // ═══════════════════════════════════════════════════════════

  async _updateSession(sessionId, data) {
    try {
      await updateDocument("onRampSessions", sessionId, {
        ...data,
        updatedAt: new Date().toISOString(),
      });
    } catch (err) {
      console.error(`[EXCHANGE] Failed to update session ${sessionId}:`, err.message);
    }
  }

  async _updateRequest(requestId, data) {
    try {
      await updateDocument("offRampRequests", requestId, {
        ...data,
        updatedAt: new Date().toISOString(),
      });
    } catch (err) {
      console.error(`[EXCHANGE] Failed to update request ${requestId}:`, err.message);
    }
  }

  _sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

module.exports = { ExchangeService };
