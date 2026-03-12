const { BybitClient } = require("./bybit-client");
const { ExchangeService } = require("./exchange-service");
const { queryDocuments, updateDocument } = require("./firebase-admin");

/**
 * Deposit Monitor
 * 
 * Polls Bybit for incoming FLOW deposits (off-ramp / sell orders).
 * 
 * NOTE: On-ramp NGN collections are handled by Yellow Card webhooks
 * (see routes/yellowcard-webhook.js), so no NGN deposit polling is needed.
 */
class DepositMonitor {
  constructor() {
    this.bybit = new BybitClient();
    this.exchangeService = new ExchangeService();
    this._running = false;
    this._pollInterval = null;
  }

  /**
   * Start the deposit monitoring loop.
   * @param {number} intervalMs - Polling interval (default 30 seconds)
   */
  start(intervalMs = 30000) {
    if (this._running) {
      console.log("[MONITOR] Already running");
      return;
    }
    this._running = true;
    console.log(`[MONITOR] Starting FLOW deposit monitor (polling every ${intervalMs / 1000}s)`);

    this._poll();
    this._pollInterval = setInterval(() => this._poll(), intervalMs);
  }

  /**
   * Stop the deposit monitoring loop.
   */
  stop() {
    if (this._pollInterval) {
      clearInterval(this._pollInterval);
      this._pollInterval = null;
    }
    this._running = false;
    console.log("[MONITOR] Deposit monitor stopped");
  }

  /**
   * Single poll cycle — check for FLOW deposits on Bybit.
   */
  async _poll() {
    try {
      await this._checkFLOWDeposits();
    } catch (error) {
      console.error("[MONITOR] Poll cycle error:", error.message);
    }
  }

  // ═══════════════════════════════════════════════════════════
  // FLOW DEPOSIT MONITORING (Off-ramp / Sell FLOW)
  // ═══════════════════════════════════════════════════════════

  /**
   * Check for FLOW deposits on Bybit that match pending off-ramp requests.
   * Requests with status "awaiting_flow_deposit" are checked.
   */
  async _checkFLOWDeposits() {
    try {
      const pendingRequests = await queryDocuments(
        "offRampRequests",
        "status",
        "==",
        "awaiting_flow_deposit"
      );

      if (!pendingRequests || pendingRequests.length === 0) return;

      console.log(`[MONITOR] Checking ${pendingRequests.length} pending FLOW deposit(s)`);

      const deposits = await this.bybit.getDepositRecords("FLOW");
      if (!deposits || deposits.length === 0) return;

      for (const request of pendingRequests) {
        const requestId = request.id;
        try {
          const match = this._matchFLOWDeposit(request, deposits);
          if (match) {
            const flowAmount = parseFloat(match.amount);
            console.log(`[MONITOR] FLOW deposit matched for request ${requestId}: ${flowAmount} FLOW`);

            await updateDocument("offRampRequests", requestId, {
              status: "flow_deposit_confirmed",
              flowDepositTxId: match.txID,
              flowDepositAmount: flowAmount,
              flowDepositConfirmedAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            });

            // Trigger the sell pipeline asynchronously
            this._triggerSellPipeline(requestId, flowAmount, request.payoutDetails);
          }
        } catch (err) {
          console.error(`[MONITOR] Error checking request ${requestId}:`, err.message);
        }
      }
    } catch (error) {
      console.error("[MONITOR] FLOW deposit check error:", error.message);
    }
  }

  /**
   * Match a Bybit FLOW deposit to a pending off-ramp request.
   */
  _matchFLOWDeposit(request, deposits) {
    const expectedAmount = parseFloat(request.amount);
    const requestCreatedAt = new Date(request.createdAt);

    return deposits.find((dep) => {
      const depAmount = parseFloat(dep.amount);
      const isConfirmed = dep.status === 1; // Bybit: 1 = success
      const amountMatch = Math.abs(depAmount - expectedAmount) < 0.01;
      const depTime = new Date(parseInt(dep.successAt) || dep.updateTime);
      const timeMatch = depTime >= requestCreatedAt;
      return amountMatch && isConfirmed && timeMatch;
    });
  }

  /**
   * Trigger the sell pipeline asynchronously.
   */
  async _triggerSellPipeline(requestId, flowAmount, bankDetails) {
    try {
      await updateDocument("offRampRequests", requestId, {
        status: "processing",
        pipelineStartedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      this.exchangeService
        .executeSellPipeline(requestId, flowAmount, bankDetails)
        .then((result) => {
          console.log(`[MONITOR] Sell pipeline completed for ${requestId}:`, result);
        })
        .catch((err) => {
          console.error(`[MONITOR] Sell pipeline failed for ${requestId}:`, err.message);
        });

    } catch (err) {
      console.error(`[MONITOR] Error triggering sell pipeline for ${requestId}:`, err.message);
    }
  }
}

// Singleton instance
const depositMonitor = new DepositMonitor();

module.exports = { DepositMonitor, depositMonitor };
