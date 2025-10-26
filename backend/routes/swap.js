const express = require("express");
const router = express.Router();
const { executeScript, t } = require("../lib/flow-client");
const fs = require("fs");
const path = require("path");

// --- Helper function to read Cadence code ---
const readCadence = (scriptName) => {
  try {
    const cadencePath = path.join(__dirname, `../cadence/swap/${scriptName}.cdc`);
    return fs.readFileSync(cadencePath, "utf8");
  } catch (error) {
    console.error(`Error reading Cadence script: ${scriptName}`, error);
    throw new Error("Could not read Cadence script.");
  }
};

/**
 * @route   GET /api/swap/quote
 * @desc    Get a swap quote from a DEX.
 * @access  Public
 */
router.get("/quote", async (req, res) => {
  try {
    const { fromToken, toToken, fromAmount } = req.query;

    if (!fromToken || !toToken || !fromAmount) {
      return res.status(400).json({ error: "Missing required query parameters." });
    }

    const getSwapQuoteScript = readCadence("get_swap_quote");
    const args = [
      [fromToken, t.String],
      [toToken, t.String],
      [fromAmount, t.UFix64],
    ];

    const amountOut = await executeScript(getSwapQuoteScript, args);

    res.json({ fromToken, toToken, fromAmount, amountOut });
  } catch (error) {
    console.error("Get swap quote error:", error);
    res.status(500).json({ error: "Failed to get swap quote." });
  }
});

/**
 * @route   POST /api/swap/execute
 * @desc    Get a transaction template for a swap.
 * @access  Public
 */
router.post("/execute", (req, res) => {
  try {
    const { fromToken, toToken, fromAmount, minAmountOut } = req.body;

    if (!fromToken || !toToken || !fromAmount || !minAmountOut) {
      return res.status(400).json({ error: "Missing required body parameters." });
    }

    const executeSwapTx = readCadence("execute_swap");
    const args = [
      [fromToken, t.String],
      [toToken, t.String],
      [fromAmount, t.UFix64],
      [minAmountOut, t.UFix64],
    ];

    res.json({
      cadence: executeSwapTx,
      args,
    });
  } catch (error) {
    console.error("Get swap transaction error:", error);
    res.status(500).json({ error: "Failed to get swap transaction." });
  }
});

module.exports = router;
