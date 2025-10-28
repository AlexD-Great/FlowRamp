require("dotenv").config();
const express = require("express");
const cors = require("cors");
const flowRoutes = require("./routes/flow");
const onRampRoutes = require("./routes/onramp");
const offRampRoutes = require("./routes/offramp");
const swapRoutes = require("./routes/swap");
const webhookRoutes = require("./routes/webhook");

const app = express();
const port = process.env.BACKEND_PORT || 3001;

const corsOptions = {
  origin: process.env.CORS_ORIGIN || "*", // Allow all origins in development
};

// Webhook route MUST come before express.json() middleware
// because Paystack signature verification requires raw body
app.use("/api/webhook", webhookRoutes);

// Middleware
app.use(cors(corsOptions));
app.use(express.json());

// Routes
app.use("/api/flow", flowRoutes);
app.use("/api/onramp", onRampRoutes);
app.use("/api/offramp", offRampRoutes);
app.use("/api/swap", swapRoutes);

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
});
