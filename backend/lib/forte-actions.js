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
      // In a real implementation, the backend would generate a secure signature.
      const backendSig = "mock-signature"; // Placeholder

      const cadence = readCadence("execute_on_ramp_with_actions");
      const args = [
        [beneficiary, t.Address],
        [amountUSD.toFixed(8), t.UFix64],
        [sessionId, t.String],
        [backendSig, t.String], // Adjusted for simplicity, use Array(t.UInt8) for real sigs
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
    try {
      const { amount, memo, requestId } = params;

      const cadence = readCadence("execute_off_ramp_with_actions");
      const args = [
          [amount.toFixed(8), t.UFix64],
          [memo, t.String],
          [requestId, t.String],
      ];

      // Note: This transaction must be signed by the USER, not the service.
      // The current `sendTransaction` helper uses the service key.
      // A complete implementation requires client-side signing for this.
      // For this refactoring, we will call it to demonstrate the logic.
      const txHash = await sendTransaction(cadence, args);
      
      console.log("Executing Off-Ramp Action:", params);
      return {
        success: true,
        txHash,
      };
    } catch (error) {
      console.error("Off-Ramp Action failed:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
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
