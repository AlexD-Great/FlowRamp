const { createDocument, updateDocument, getDocument } = require("./firebase-admin");

/**
 * Transaction Tracker Service
 * Tracks blockchain transaction status and provides retry logic
 */
class TransactionTracker {
  constructor() {
    this.maxRetries = 3;
    this.retryDelay = 5000; // 5 seconds
  }

  /**
   * Create a new transaction record
   */
  async createTransaction(txData) {
    const transaction = {
      ...txData,
      status: "pending",
      attempts: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const txId = await createDocument("transactions", transaction);
    return { txId, ...transaction };
  }

  /**
   * Update transaction status
   */
  async updateTransactionStatus(txId, status, additionalData = {}) {
    const updates = {
      status,
      updatedAt: new Date().toISOString(),
      ...additionalData,
    };

    await updateDocument("transactions", txId, updates);
    return updates;
  }

  /**
   * Get transaction by ID
   */
  async getTransaction(txId) {
    return await getDocument("transactions", txId);
  }

  /**
   * Execute transaction with retry logic
   */
  async executeWithRetry(txFunction, txData) {
    let lastError;
    
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        console.log(`🔄 Transaction attempt ${attempt}/${this.maxRetries}`);
        
        const result = await txFunction();
        
        if (result.success) {
          console.log(`✅ Transaction succeeded on attempt ${attempt}`);
          return {
            success: true,
            result,
            attempts: attempt,
          };
        }
        
        lastError = result.error || "Transaction failed";
      } catch (error) {
        console.error(`❌ Transaction attempt ${attempt} failed:`, error.message);
        lastError = error;
        
        // Don't retry on certain errors
        if (this.isNonRetryableError(error)) {
          break;
        }
        
        // Wait before retrying (except on last attempt)
        if (attempt < this.maxRetries) {
          await this.delay(this.retryDelay * attempt); // Exponential backoff
        }
      }
    }

    return {
      success: false,
      error: lastError instanceof Error ? lastError.message : lastError,
      attempts: this.maxRetries,
    };
  }

  /**
   * Check if error should not be retried
   */
  isNonRetryableError(error) {
    const nonRetryableMessages = [
      "insufficient balance",
      "invalid signature",
      "unauthorized",
      "not found",
      "invalid address",
    ];

    const errorMessage = error.message?.toLowerCase() || "";
    return nonRetryableMessages.some(msg => errorMessage.includes(msg));
  }

  /**
   * Delay helper
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Monitor transaction on blockchain
   */
  async monitorTransaction(txHash, timeout = 60000) {
    const startTime = Date.now();
    const pollInterval = 2000; // 2 seconds

    while (Date.now() - startTime < timeout) {
      try {
        // In a real implementation, query the blockchain for tx status
        // For now, we'll simulate monitoring
        console.log(`🔍 Monitoring transaction: ${txHash}`);
        
        // TODO: Implement actual blockchain status check
        // const status = await fcl.tx(txHash).onceSealed();
        
        await this.delay(pollInterval);
        
        // Placeholder: assume success after timeout/2
        if (Date.now() - startTime > timeout / 2) {
          return {
            status: "sealed",
            txHash,
            blockHeight: Math.floor(Math.random() * 1000000),
          };
        }
      } catch (error) {
        console.error("Error monitoring transaction:", error);
        throw error;
      }
    }

    throw new Error("Transaction monitoring timeout");
  }
}

module.exports = {
  TransactionTracker,
};
