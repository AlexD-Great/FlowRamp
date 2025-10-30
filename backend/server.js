require("dotenv").config();
const express = require("express");
const cors = require("cors");
const flowRoutes = require("./routes/flow");
const onRampRoutes = require("./routes/onramp");
const offRampRoutes = require("./routes/offramp");
const swapRoutes = require("./routes/swap");
const webhookRoutes = require("./routes/webhook");
const walletRoutes = require("./routes/wallet");
const kycRoutes = require("./routes/kyc");
const { errorHandler, notFoundHandler } = require("./lib/error-handler");
const { generalLimiter } = require("./lib/rate-limiter");

const app = express();
// Render provides PORT, but we also support BACKEND_PORT for local development
const port = process.env.PORT || process.env.BACKEND_PORT || 3001;

const corsOptions = {
  origin: process.env.CORS_ORIGIN || "*", // Allow all origins in development
};

// Webhook route MUST come before express.json() middleware
// because Paystack signature verification requires raw body
app.use("/api/webhook", webhookRoutes);

// Middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use(generalLimiter); // Apply rate limiting to all routes

// Routes
app.use("/api/flow", flowRoutes);
app.use("/api/onramp", onRampRoutes);
app.use("/api/offramp", offRampRoutes);
app.use("/api/swap", swapRoutes);
app.use("/api/wallet", walletRoutes);
app.use("/api/kyc", kycRoutes);

app.get("/", (req, res) => {
  res.json({ 
    message: "FlowRamp Backend is running!",
    version: "1.0.0",
    network: process.env.FLOW_NETWORK || "testnet",
    timestamp: new Date().toISOString()
  });
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ 
    status: "healthy", 
    uptime: process.uptime(),
    timestamp: new Date().toISOString() 
  });
});

// 404 handler
app.use(notFoundHandler);

// Global error handler (must be last)
app.use(errorHandler);

app.listen(port, () => {
  console.log(`🚀 FlowRamp Backend listening at http://localhost:${port}`);
  console.log(`📡 Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(`⛓️  Network: ${process.env.FLOW_NETWORK || "testnet"}`);
});
