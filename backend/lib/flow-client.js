const fcl = require("@onflow/fcl");
const t = require("@onflow/types");
const { authorization } = require("./crypto"); // We will create this file next

// --- FCL Configuration ---
fcl.config({
  "accessNode.api": process.env.FLOW_ACCESS_NODE,
  "flow.network": process.env.FLOW_NETWORK || "testnet",
});

const executeScript = async (cadence, args = []) => {
  try {
    const result = await fcl.query({
      cadence,
      args: (arg, t) => args.map(([value, type]) => arg(value, type)),
    });
    return result;
  } catch (error) {
    console.error("Error executing script:", error);
    throw error;
  }
};

const sendTransaction = async (cadence, args = []) => {
  try {
    const authz = authorization(
      process.env.FLOW_ACCOUNT_ADDRESS,
      process.env.FLOW_PRIVATE_KEY,
      0 // This should be a sequence number, but for simplicity we'll use 0 for now.
        // In a real application, you would need to manage the sequence number.
    );

    const txId = await fcl.mutate({
      cadence,
      args: (arg, t) => args.map(([value, type]) => arg(value, type)),
      proposer: authz,
      payer: authz,
      authorizations: [authz],
      limit: 9999,
    });

    return txId;
  } catch (error) {
    console.error("Error sending transaction:", error);
    throw error;
  }
};

const getTransactionStatus = async (txId) => {
  try {
    const status = await fcl.tx(txId).onceSealed();
    return status;
  } catch (error) {
    console.error("Error getting transaction status:", error);
    throw error;
  }
};

module.exports = {
  executeScript,
  sendTransaction,
  getTransactionStatus,
  t, // Export the 't' object for use in routes
};
