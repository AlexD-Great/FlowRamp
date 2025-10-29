const express = require("express");
const router = express.Router();
const fcl = require("@onflow/fcl");
const fs = require("fs");
const path = require("path");
const { protect } = require("../lib/auth");

// Configure FCL
fcl.config({
  "accessNode.api": process.env.FLOW_ACCESS_NODE || "https://rest-testnet.onflow.org",
  "flow.network": process.env.FLOW_NETWORK || "testnet",
});

/**
 * @route   GET /api/wallet/balance/:address
 * @desc    Get Flow token balances for an address
 * @access  Private
 */
router.get("/balance/:address", protect, async (req, res) => {
  try {
    const { address } = req.params;
    
    // Validate address format
    if (!address || !address.startsWith("0x")) {
      return res.status(400).json({ error: "Invalid Flow address" });
    }

    // Read the Cadence script
    const scriptPath = path.join(__dirname, "../cadence/scripts/getBalances.cdc");
    const cadenceCode = fs.readFileSync(scriptPath, "utf8");

    // Query the blockchain for FLOW balance
    const flowBalance = await fcl.query({
      cadence: cadenceCode,
      args: (arg, t) => [arg(address, t.Address)],
    });

    // For now, we'll query FLOW balance and set others to 0
    // TODO: Add separate scripts for fUSDC and fUSDT balances
    const balances = {
      flow: parseFloat(flowBalance || "0").toFixed(2),
      fusdc: "0.00", // Placeholder until we implement fUSDC balance query
      fusdt: "0.00", // Placeholder until we implement fUSDT balance query
      address: address,
      lastUpdated: new Date().toISOString(),
    };

    res.json(balances);
  } catch (error) {
    console.error("Get balance error:", error);
    res.status(500).json({ 
      error: "Failed to fetch balance",
      message: error.message 
    });
  }
});

/**
 * @route   GET /api/wallet/transactions/:address
 * @desc    Get transaction history for an address (from Flow blockchain)
 * @access  Private
 */
router.get("/transactions/:address", protect, async (req, res) => {
  try {
    const { address } = req.params;
    
    if (!address || !address.startsWith("0x")) {
      return res.status(400).json({ error: "Invalid Flow address" });
    }

    // TODO: Implement blockchain transaction history query
    // This would require querying Flow's transaction API or indexer
    
    res.json({ 
      transactions: [],
      message: "Blockchain transaction history coming soon" 
    });
  } catch (error) {
    console.error("Get transactions error:", error);
    res.status(500).json({ error: "Failed to fetch transactions" });
  }
});

/**
 * @route   POST /api/wallet/verify
 * @desc    Verify wallet ownership
 * @access  Private
 */
router.post("/verify", protect, async (req, res) => {
  try {
    const { address, signature } = req.body;
    
    if (!address || !signature) {
      return res.status(400).json({ error: "Address and signature required" });
    }

    // TODO: Implement wallet verification logic
    // This would verify the signature matches the address
    
    res.json({ 
      verified: false,
      message: "Wallet verification coming soon" 
    });
  } catch (error) {
    console.error("Verify wallet error:", error);
    res.status(500).json({ error: "Failed to verify wallet" });
  }
});

module.exports = router;
