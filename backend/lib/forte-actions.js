const { sendTransaction, executeScript, t } = require("./flow-client");
const fs = require("fs");
const path = require("path");

// --- Helper function to read Cadence code ---
const readCadence = (scriptName) => {
  try {
    const cadencePath = path.join(__dirname, `../cadence/forte/${scriptName}.cdc`);
    return fs.readFileSync(cadencePath, "utf8");
  } catch (error) {
    console.error(`Error reading Cadence script: ${scriptName}`, error);
    throw new Error("Could not read Cadence script.");
  }
};

class ForteActionsService {
  constructor() {
    // In a real application, you might have different service wallets
    // for different purposes.
    this.serviceWalletAddress = process.env.FLOW_ACCOUNT_ADDRESS;
  }

  async executeOnRampAction(params) {
    try {
      const { beneficiary, amountUSD, sessionId } = params;
      // In a real implementation, the backend would sign the session ID
      // and the Cadence script would verify the signature.
      const backendSig = "mock-signature";

      const cadence = readCadence("executeOnRamp");
      const args = [
        [beneficiary, t.Address],
        [amountUSD.toFixed(8), t.UFix64],
        ["FUSD", t.String],
        [sessionId, t.String],
        [backendSig, t.Array(t.UInt8)],
      ];

      const txHash = await sendTransaction(cadence, args);
      return {
        success: true,
        txHash,
        actionId: `action_onramp_${Date.now()}`,
      };
    } catch (error) {
      console.error("On-Ramp Action failed:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  async executeOffRampAction(params) {
    // This is a placeholder for the off-ramp logic.
    console.log("Executing Off-Ramp Action:", params);
    return {
      success: true,
      txHash: `0xflow_offramp_${Date.now()}`,
    };
  }

  async getBalance(address) {
    try {
      const cadence = readCadence("getBalance");
      const args = [[address, t.Address]];
      const balance = await executeScript(cadence, args);
      return parseFloat(balance);
    } catch (error) {
      console.error(`Failed to get balance for ${address}:`, error);
      return 0;
    }
  }
}

module.exports = {
  ForteActionsService,
};
