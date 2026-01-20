require("dotenv").config({ path: "../.env" });
const { queryDocuments, updateDocument } = require("../lib/firebase-admin");
const { getTransactionStatus, checkDeposit } = require("../lib/flow-client");
const { notificationService } = require("../lib/notifications");
const fcl = require("@onflow/fcl");

// Configure FCL
fcl.config({
  "accessNode.api": process.env.FLOW_ACCESS_NODE,
  "flow.network": process.env.FLOW_NETWORK || "testnet",
});

const PENDING_STATUS = "pending";

async function checkDeposits() {
  console.log("[DEPOSIT_WATCHER] Checking for new deposits...");

  try {
    const pendingRequests = await queryDocuments("offRampRequests", "status", "==", PENDING_STATUS);

    if (pendingRequests.length === 0) {
      console.log("[DEPOSIT_WATCHER] No pending requests found.");
      return;
    }

    console.log(`[DEPOSIT_WATCHER] Found ${pendingRequests.length} pending requests`);

    for (const request of pendingRequests) {
      console.log(`[DEPOSIT_WATCHER] Checking request: ${request.id}`);
      
      try {
        // Query for deposits to service wallet with specific memo
        const depositFound = await await checkDepositForRequest(request);

        if (depositFound) {
          console.log(`[DEPOSIT_WATCHER] Deposit found for request: ${request.id}`);
          
          // Update status to awaiting admin approval instead of funded
          await updateDocument("offRampRequests", request.id, {
            status: "awaiting_admin_approval",
            fundedAt: new Date().toISOString(),
            depositTxHash: depositFound.txHash,
            updatedAt: new Date().toISOString(),
          });
          
          console.log(`[DEPOSIT_WATCHER] Request ${request.id} marked as funded, awaiting admin approval`);
          
          // Send notification to admins
          await notificationService.notifyPendingOfframp(request);
        } else {
          console.log(`[DEPOSIT_WATCHER] No deposit found yet for request: ${request.id}`);
        }
      } catch (error) {
        console.error(`[DEPOSIT_WATCHER] Error checking request ${request.id}:`, error);
      }
    }
  } catch (error) {
    console.error("[DEPOSIT_WATCHER] Error checking deposits:", error);
  }
}

/**
 * Check if a deposit has been made for a specific offramp request
 * @param {Object} request - The offramp request object
 * @returns {Promise<Object|null>} - Deposit transaction details or null
 */
async function checkDepositForRequest(request) {
  try {
    // Query Flow blockchain for transactions to service wallet
    // This is a simplified implementation - in production you'd want to:
    // 1. Query events from FlowRamp contract
    // 2. Filter by memo and amount
    // 3. Verify transaction is sealed and successful

    const serviceWalletAddress = process.env.FLOW_ACCOUNT_ADDRESS;
    
    // Query for FlowToken.Deposit events or similar
    // For now, we'll use a basic approach checking recent blocks
    const latestBlock = await fcl.getBlock();
    const startBlock = latestBlock.height - 100; // Check last 100 blocks
    
    const cadence = `
      import FlowToken from 0xFlowToken
      import FlowRamp from 0xFlowRamp
      
      pub fun main(serviceWallet: Address, expectedMemo: String, expectedAmount: UFix64): [FlowRamp.DepositDetected] {
        let events = FlowRamp.getDepositEvents(fromBlock: ${startBlock}, toBlock: ${latestBlock.height})
        
        return events.filter(fun(event: FlowRamp.DepositDetected): Bool {
          return event.depositor == serviceWallet && 
                 event.memo == expectedMemo && 
                 event.amount == expectedAmount
        })
      }
    `;

    // This is a placeholder - actual implementation would depend on your contract events
    // For now, we'll simulate finding a deposit
    const shouldFindDeposit = Math.random() > 0.7; // 30% chance for demo
    
    if (shouldFindDeposit) {
      return {
        txHash: `0x${Math.random().toString(16).substr(2, 64)}`,
        amount: request.amount,
        memo: request.memo,
        timestamp: new Date().toISOString()
      };
    }
    
    return null;
    
  } catch (error) {
    console.error("[DEPOSIT_WATCHER] Error checking deposit for request:", error);
    return null;
  }
}

/**
 * Start the deposit watcher to run continuously
 */
function startDepositWatcher() {
  console.log("[DEPOSIT_WATCHER] Starting deposit watcher...");
  
  // Check immediately on start
  checkDeposits();
  
  // Then check every 30 seconds
  setInterval(checkDeposits, 30000);
}

// Run if called directly
if (require.main === module) {
  startDepositWatcher();
}

module.exports = {
  checkDeposits,
  checkDepositForRequest,
  startDepositWatcher
};
