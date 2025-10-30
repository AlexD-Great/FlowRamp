/**
 * Find Labs API Client
 * Provides real-time Flow blockchain data access
 * 
 * Get your FREE API key: https://flowscan.notion.site/Find-Labs-Forte-Hacks-285873cae2b680918231f4dea2ac0582
 */

const axios = require('axios');

class FindLabsClient {
  constructor() {
    this.baseURL = 'https://api.findlabs.io/v1'; // Update with actual endpoint
    this.apiKey = process.env.FIND_LABS_API_KEY;
    
    if (!this.apiKey) {
      console.warn('⚠️  FIND_LABS_API_KEY not set. Get your free key at: https://flowscan.notion.site/Find-Labs-Forte-Hacks-285873cae2b680918231f4dea2ac0582');
    }
  }

  /**
   * Get block information
   */
  async getBlock(blockHeight) {
    try {
      const response = await axios.get(`${this.baseURL}/blocks/${blockHeight}`, {
        headers: { 'Authorization': `Bearer ${this.apiKey}` }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching block:', error.message);
      throw error;
    }
  }

  /**
   * Get transaction details
   */
  async getTransaction(txHash) {
    try {
      const response = await axios.get(`${this.baseURL}/transactions/${txHash}`, {
        headers: { 'Authorization': `Bearer ${this.apiKey}` }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching transaction:', error.message);
      throw error;
    }
  }

  /**
   * Get events for a specific transaction
   */
  async getTransactionEvents(txHash) {
    try {
      const response = await axios.get(`${this.baseURL}/transactions/${txHash}/events`, {
        headers: { 'Authorization': `Bearer ${this.apiKey}` }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching transaction events:', error.message);
      throw error;
    }
  }

  /**
   * Get events by type
   */
  async getEvents(eventType, fromBlock, toBlock) {
    try {
      const response = await axios.get(`${this.baseURL}/events`, {
        headers: { 'Authorization': `Bearer ${this.apiKey}` },
        params: {
          type: eventType,
          from_block: fromBlock,
          to_block: toBlock
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching events:', error.message);
      throw error;
    }
  }

  /**
   * Get staking rewards for delegated staking
   */
  async getDelegatedStakingRewards(address) {
    try {
      const response = await axios.get(`${this.baseURL}/staking/delegated/${address}/rewards`, {
        headers: { 'Authorization': `Bearer ${this.apiKey}` }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching delegated staking rewards:', error.message);
      throw error;
    }
  }

  /**
   * Get node staking rewards
   */
  async getNodeStakingRewards(nodeId) {
    try {
      const response = await axios.get(`${this.baseURL}/staking/nodes/${nodeId}/rewards`, {
        headers: { 'Authorization': `Bearer ${this.apiKey}` }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching node staking rewards:', error.message);
      throw error;
    }
  }

  /**
   * Monitor transaction status with real-time updates
   */
  async monitorTransaction(txHash, callback, maxAttempts = 30) {
    let attempts = 0;
    const pollInterval = 2000; // 2 seconds

    const poll = async () => {
      try {
        const tx = await this.getTransaction(txHash);
        
        callback({
          status: tx.status,
          blockHeight: tx.block_height,
          timestamp: tx.timestamp,
          events: tx.events
        });

        // If sealed or failed, stop polling
        if (tx.status === 'sealed' || tx.status === 'failed') {
          return tx;
        }

        // Continue polling
        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(poll, pollInterval);
        } else {
          throw new Error('Transaction monitoring timeout');
        }
      } catch (error) {
        console.error('Error monitoring transaction:', error.message);
        throw error;
      }
    };

    return poll();
  }

  /**
   * Get FlowRamp specific on-ramp events
   */
  async getFlowRampOnRampEvents(fromBlock, toBlock) {
    const contractAddress = process.env.FLOW_ACCOUNT_ADDRESS;
    return this.getEvents(`A.${contractAddress}.FlowRamp.OnRampCompleted`, fromBlock, toBlock);
  }

  /**
   * Get FlowRamp specific off-ramp events
   */
  async getFlowRampOffRampEvents(fromBlock, toBlock) {
    const contractAddress = process.env.FLOW_ACCOUNT_ADDRESS;
    return this.getEvents(`A.${contractAddress}.FlowRamp.OffRampCompleted`, fromBlock, toBlock);
  }
}

module.exports = {
  FindLabsClient
};
