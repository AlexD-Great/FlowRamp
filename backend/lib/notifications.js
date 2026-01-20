const { queryDocuments } = require("../lib/firebase-admin");

/**
 * Notification system for admin approvals
 * This can be extended to use email, SMS, WebSocket, or other notification methods
 */

class NotificationService {
  constructor() {
    this.notifications = [];
  }

  /**
   * Send notification for pending onramp approval
   * @param {Object} session - The onramp session data
   */
  async notifyPendingOnramp(session) {
    const message = `🟡 Pending Onramp Approval Required
    User: ${session.userEmail || session.userId}
    Amount: ${session.fiatAmount} ${session.fiatCurrency} (≈$${session.usdAmount} USD)
    Wallet: ${session.walletAddress}
    Session ID: ${session.id}
    Created: ${new Date(session.createdAt).toLocaleString()}`;

    console.log(`[NOTIFICATION] ${message}`);
    
    // Store notification for potential admin dashboard
    this.notifications.push({
      type: 'pending_onramp',
      sessionId: session.id,
      message,
      timestamp: new Date().toISOString(),
      read: false
    });

    // TODO: Add other notification methods:
    // - Send email to admins
    // - Send WebSocket notification to admin dashboard
    // - Send SMS if configured
    // - Push notification via service like OneSignal
  }

  /**
   * Send notification for pending offramp approval
   * @param {Object} request - The offramp request data
   */
  async notifyPendingOfframp(request) {
    const message = `🟡 Pending Offramp Approval Required
    User: ${request.userId}
    Amount: ${request.amount} ${request.token}
    Payout Method: ${request.payoutMethod}
    Request ID: ${request.id}
    Created: ${new Date(request.createdAt).toLocaleString()}`;

    console.log(`[NOTIFICATION] ${message}`);
    
    // Store notification for potential admin dashboard
    this.notifications.push({
      type: 'pending_offramp',
      requestId: request.id,
      message,
      timestamp: new Date().toISOString(),
      read: false
    });

    // TODO: Add other notification methods
  }

  /**
   * Send notification for low wallet balance
   * @param {number} balance - Current wallet balance
   * @param {number} threshold - Warning threshold
   */
  async notifyLowBalance(balance, threshold = 10) {
    const message = `🔴 Low Wallet Balance Warning
    Current Balance: ${balance} FLOW
    Warning Threshold: ${threshold} FLOW
    Please fund the service wallet to continue processing onramp requests`;

    console.log(`[NOTIFICATION] ${message}`);
    
    this.notifications.push({
      type: 'low_balance',
      balance,
      threshold,
      message,
      timestamp: new Date().toISOString(),
      read: false
    });
  }

  /**
   * Get unread notifications for admin dashboard
   * @returns {Array} - Array of unread notifications
   */
  async getUnreadNotifications() {
    return this.notifications.filter(n => !n.read);
  }

  /**
   * Mark notifications as read
   * @param {Array} notificationIds - Array of notification IDs to mark as read
   */
  async markAsRead(notificationIds) {
    this.notifications = this.notifications.map(n => {
      if (notificationIds.includes(n.timestamp)) { // Using timestamp as ID for simplicity
        n.read = true;
      }
      return n;
    });
  }

  /**
   * Check for pending approvals and send notifications
   * This should be called periodically
   */
  async checkPendingApprovals() {
    try {
      // Check pending onramp sessions
      const pendingOnramp = await queryDocuments(
        "onRampSessions", 
        "status", 
        "==", 
        "awaiting_admin_approval"
      );

      // Check pending offramp requests
      const pendingOfframp = await queryDocuments(
        "offRampRequests", 
        "status", 
        "==", 
        "awaiting_admin_approval"
      );

      // Send notifications for new pending items
      for (const session of pendingOnramp) {
        await this.notifyPendingOnramp(session);
      }

      for (const request of pendingOfframp) {
        await this.notifyPendingOfframp(request);
      }

      return {
        pendingOnrampCount: pendingOnramp.length,
        pendingOfframpCount: pendingOfframp.length,
      };

    } catch (error) {
      console.error("[NOTIFICATION] Error checking pending approvals:", error);
      throw error;
    }
  }
}

// Singleton instance
const notificationService = new NotificationService();

module.exports = {
  NotificationService,
  notificationService,
};
