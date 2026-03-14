require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });
require("../lib/notifier").notifyNewBuyOrder({
  sessionId: "test-123",
  userEmail: "test@example.com",
  fiatAmount: 50000,
  estimatedFLOW: 25,
  walletAddress: "0xABC123"
});
