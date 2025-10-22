const express = require("express");
const router = express.Router();
const fcl = require("@onflow/fcl");
const fs = require("fs");
const path = require("path");

// --- FCL Configuration ---
// Make sure to create a .env file in the 'backend' directory with your Flow access node and private key.
fcl.config({
  "accessNode.api": process.env.FLOW_ACCESS_NODE,
  "discovery.wallet": `https://fcl-discovery.onflow.org/testnet/authn`, // Testnet
});

// --- Helper function to read Cadence code ---
const readCadence = (scriptName) => {
  try {
    const cadencePath = path.join(__dirname, `../cadence/scripts/${scriptName}.cdc`);
    return fs.readFileSync(cadencePath, "utf8");
  } catch (error) {
    console.error(`Error reading Cadence script: ${scriptName}`, error);
    throw new Error("Could not read Cadence script.");
  }
};

// --- API Routes ---

/**
 * @route   GET /api/flow/scripts/get-greeting
 * @desc    Execute a simple Cadence script to get a greeting.
 * @access  Public
 */
router.get("/scripts/get-greeting", async (req, res) => {
  try {
    const getGreetingScript = readCadence("getGreeting");

    const greeting = await fcl.query({
      cadence: getGreetingScript,
    });

    res.json({ success: true, greeting });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: "Failed to execute script." });
  }
});

module.exports = router;
