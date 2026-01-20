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

/**
 * Get the FLOW token balance of the service wallet
 * @returns {Promise<number>} - The balance in FLOW tokens
 */
const getServiceWalletBalance = async () => {
  try {
    const cadence = `
      import FungibleToken from 0xFungibleToken
      import FlowToken from 0xFlowToken
      
      pub fun main(address: Address): UFix64 {
        let account = getAccount(address)
        
        let vaultRef = account.borrow<&FlowToken.Vault>(from: /storage/flowTokenVault)
          ?? panic("Could not borrow FlowToken.Vault")
        
        return vaultRef.balance
      }
    `;

    const balance = await executeScript(cadence, [
      [process.env.FLOW_ACCOUNT_ADDRESS, t.Address]
    ]);

    console.log(`[FLOW] Service wallet balance: ${balance} FLOW`);
    return parseFloat(balance);
  } catch (error) {
    console.error("[FLOW] Error getting service wallet balance:", error);
    throw error;
  }
};

/**
 * Check if a deposit has been made to the service wallet
 * @param {string} expectedAmount - Expected amount
 * @param {string} expectedMemo - Expected memo
 * @returns {Promise<boolean>} - Whether deposit was found
 */
const checkDeposit = async (expectedAmount, expectedMemo) => {
  try {
    // This would typically involve querying events or transaction history
    // For now, we'll use a simplified approach
    const cadence = `
      import FlowToken from 0xFlowToken
      
      // This is a simplified check - in production you'd want to query
      // transaction events for deposits with specific memos
      pub fun main(): UFix64 {
        // Return current balance for comparison
        // In a real implementation, you'd track deposits via events
        return 0.0
      }
    `;

    const result = await executeScript(cadence);
    return result; // Simplified for now
  } catch (error) {
    console.error("[FLOW] Error checking deposit:", error);
    throw error;
  }
};

module.exports = {
  executeScript,
  sendTransaction,
  getTransactionStatus,
  getServiceWalletBalance,
  checkDeposit,
  t, // Export the 't' object for use in routes
};
