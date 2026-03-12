require("dotenv").config();
const express = require("express");
const cors = require("cors");
const flowRoutes = require("./routes/flow");
const onRampRoutes = require("./routes/onramp");
const offRampRoutes = require("./routes/offramp");
const swapRoutes = require("./routes/swap");
const webhookRoutes = require("./routes/webhook");
const walletRoutes = require("./routes/wallet");
const walletVerificationRoutes = require("./routes/wallet-verification");
const kycRoutes = require("./routes/kyc");
const exchangeRoutes = require("./routes/exchange");
const adminRoutes = require("./routes/admin");
const ycWebhookRoutes = require("./routes/yellowcard-webhook");
const { depositMonitor } = require("./lib/deposit-monitor");

const app = express();
// Render provides PORT, but we also support BACKEND_PORT for local development
const port = process.env.PORT || process.env.BACKEND_PORT || 3001;

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'http://localhost:3000',
      'https://flowramp.vercel.app',
      'https://flowramp-git-main-alexd-greats-projects.vercel.app', // Vercel preview URLs
      process.env.CORS_ORIGIN
    ].filter(Boolean);
    
    // Check if origin matches any pattern
    const isAllowed = allowedOrigins.some(allowed => {
      if (allowed === '*') return true;
      if (allowed && origin.includes('vercel.app')) return true;
      return origin === allowed;
    });
    
    if (isAllowed) {
      callback(null, true);
    } else {
      console.log('Blocked by CORS:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

// Webhook routes MUST come before express.json() middleware
// because signature verification requires raw body
app.use("/api/webhook", webhookRoutes);
app.use("/api/yc-webhook", ycWebhookRoutes);

// Middleware
app.use(cors(corsOptions));
app.use(express.json());

// Routes
app.use("/api/flow", flowRoutes);
app.use("/api/onramp", onRampRoutes);
app.use("/api/offramp", offRampRoutes);
app.use("/api/swap", swapRoutes);
app.use("/api/wallet", walletRoutes);
app.use("/api/wallet", walletVerificationRoutes);
app.use("/api/kyc", kycRoutes);
app.use("/api/exchange", exchangeRoutes);
app.use("/api/admin", adminRoutes);

app.get("/", (req, res) => {
  res.send("FlowRamp Backend is running!");
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "healthy", timestamp: new Date().toISOString() });
});

app.listen(port, () => {
  console.log(`Backend server listening at http://localhost:${port}`);
  console.log(`Environment: ${process.env.NODE_ENV || "development"}`);

  // Start the deposit monitor to poll Bybit for incoming FLOW deposits (off-ramp)
  // On-ramp NGN collections are handled by Yellow Card webhooks (/api/yc-webhook)
  if (process.env.BYBIT_API_KEY) {
    const pollInterval = parseInt(process.env.DEPOSIT_POLL_INTERVAL_MS) || 30000;
    depositMonitor.start(pollInterval);
    console.log(`FLOW deposit monitor started (polling every ${pollInterval / 1000}s)`);
  } else {
    console.warn("BYBIT_API_KEY not configured — FLOW deposit monitor NOT started.");
  }

  if (!process.env.YELLOWCARD_API_KEY) {
    console.warn("YELLOWCARD_API_KEY not configured — Yellow Card fiat rails disabled.");
  }
});
