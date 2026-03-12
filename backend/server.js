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
<<<<<<< HEAD
const exchangeRoutes = require("./routes/exchange");
const adminRoutes = require("./routes/admin");
const ycWebhookRoutes = require("./routes/yellowcard-webhook");
const { depositMonitor } = require("./lib/deposit-monitor");
=======
const ratesRoutes = require("./routes/rates");
const adminRoutes = require("./routes/admin");
>>>>>>> d5738958941ae82dc8f0de0a35879885923954e8

const app = express();
const port = process.env.PORT || process.env.BACKEND_PORT || 3001;

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);

    const allowedOrigins = [
      "http://localhost:3000",
      "https://flowramp.xyz",
      "https://www.flowramp.xyz",
      process.env.CORS_ORIGIN,
    ].filter(Boolean);

    const isAllowed = allowedOrigins.some((allowed) => {
      if (allowed === "*") return true;
      return origin === allowed;
    });

    if (isAllowed) {
      callback(null, true);
    } else {
      console.log("Blocked by CORS:", origin);
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

<<<<<<< HEAD
// Webhook routes MUST come before express.json() middleware
// because signature verification requires raw body
=======
>>>>>>> d5738958941ae82dc8f0de0a35879885923954e8
app.use("/api/webhook", webhookRoutes);
app.use("/api/yc-webhook", ycWebhookRoutes);

app.use(cors(corsOptions));
app.use(express.json());

app.use("/api/flow", flowRoutes);
app.use("/api/onramp", onRampRoutes);
app.use("/api/offramp", offRampRoutes);
app.use("/api/swap", swapRoutes);
app.use("/api/wallet", walletRoutes);
app.use("/api/wallet", walletVerificationRoutes);
app.use("/api/kyc", kycRoutes);
<<<<<<< HEAD
app.use("/api/exchange", exchangeRoutes);
=======
app.use("/api/rates", ratesRoutes);
>>>>>>> d5738958941ae82dc8f0de0a35879885923954e8
app.use("/api/admin", adminRoutes);

app.get("/", (req, res) => {
  res.send("FlowRamp Backend is running!");
});

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
