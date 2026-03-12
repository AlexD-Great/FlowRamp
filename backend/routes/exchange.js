const express = require("express");
const router = express.Router();
const { RateProvider } = require("../lib/rate-provider");
const { ExchangeService } = require("../lib/exchange-service");
const { protect } = require("../lib/auth");

const rateProvider = new RateProvider();
const exchangeService = new ExchangeService();

/**
 * @route   GET /api/exchange/rates
 * @desc    Get live FLOW/NGN rates for buying and selling.
 * @access  Public
 */
router.get("/rates", async (req, res) => {
  try {
    const [buyRate, sellRate] = await Promise.all([
      rateProvider.getBuyRate(),
      rateProvider.getSellRate(),
    ]);

    res.json({
      buy: {
        flowNGNRate: buyRate.flowNGNRate,
        usdtNGNRate: buyRate.usdtNGNRate,
        flowUSDTRate: buyRate.flowUSDTRate,
      },
      sell: {
        flowNGNRate: sellRate.flowNGNRate,
        usdtNGNRate: sellRate.usdtNGNRate,
        flowUSDTRate: sellRate.flowUSDTRate,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Get rates error:", error.message);
    res.status(500).json({ error: "Failed to fetch live rates" });
  }
});

/**
 * @route   GET /api/exchange/calculate-buy
 * @desc    Calculate how much FLOW a user gets for a given NGN amount.
 * @access  Public
 */
router.get("/calculate-buy", async (req, res) => {
  try {
    const { ngnAmount } = req.query;
    if (!ngnAmount || isNaN(ngnAmount)) {
      return res.status(400).json({ error: "ngnAmount is required and must be a number" });
    }

    const calculation = await rateProvider.calculateBuy(parseFloat(ngnAmount));
    res.json(calculation);
  } catch (error) {
    console.error("Calculate buy error:", error.message);
    res.status(500).json({ error: "Failed to calculate buy amount" });
  }
});

/**
 * @route   GET /api/exchange/calculate-sell
 * @desc    Calculate how much NGN a user gets for selling FLOW.
 * @access  Public
 */
router.get("/calculate-sell", async (req, res) => {
  try {
    const { flowAmount } = req.query;
    if (!flowAmount || isNaN(flowAmount)) {
      return res.status(400).json({ error: "flowAmount is required and must be a number" });
    }

    const calculation = await rateProvider.calculateSell(parseFloat(flowAmount));
    res.json(calculation);
  } catch (error) {
    console.error("Calculate sell error:", error.message);
    res.status(500).json({ error: "Failed to calculate sell amount" });
  }
});

/**
 * @route   GET /api/exchange/deposit-info
 * @desc    Get deposit details for both buy (NGN) and sell (FLOW) operations.
 * @access  Private
 */
router.get("/deposit-info", protect, async (req, res) => {
  try {
    const flowAddress = await exchangeService.getBybitFLOWDepositAddress();

    res.json({
      buy: {
        description: "NGN collection is handled per-session via Yellow Card. Create a session to get bank details.",
      },
      sell: {
        description: "Send FLOW to this address to sell for NGN",
        flowDepositAddress: flowAddress,
      },
    });
  } catch (error) {
    console.error("Get deposit info error:", error.message);
    res.status(500).json({ error: "Failed to get deposit information" });
  }
});

/**
 * @route   GET /api/exchange/balances
 * @desc    Get operator's exchange balances (admin only).
 * @access  Private (admin)
 */
router.get("/balances", protect, async (req, res) => {
  try {
    const [ycAccount, bybitUSDT, bybitFLOW] = await Promise.all([
      exchangeService.yellowCard.getAccount(),
      exchangeService.bybit.getBalance("USDT"),
      exchangeService.bybit.getBalance("FLOW"),
    ]);

    res.json({
      yellowCard: {
        usdFloat: ycAccount?.balance || ycAccount,
      },
      bybit: {
        usdt: bybitUSDT,
        flow: bybitFLOW,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Get balances error:", error.message);
    res.status(500).json({ error: "Failed to get exchange balances" });
  }
});

/**
 * @route   GET /api/exchange/banks
 * @desc    Get list of Nigerian banks (for off-ramp bank selection).
 * @access  Public
 */
router.get("/banks", async (req, res) => {
  try {
    const networks = await exchangeService.getNigerianBankNetworks();
    const banks = networks.filter((n) => n.type === "bank");
    res.json({ banks });
  } catch (error) {
    console.error("Get banks error:", error.message);
    res.status(500).json({ error: "Failed to fetch bank list" });
  }
});

module.exports = router;
