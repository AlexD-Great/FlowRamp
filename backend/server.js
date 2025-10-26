require("dotenv").config();
const express = require("express");
const cors = require("cors");
const flowRoutes = require("./routes/flow");
const onRampRoutes = require("./routes/onramp");
const offRampRoutes = require("./routes/offramp");
const swapRoutes = require("./routes/swap");
const swapRoutes = require("./routes/swap");

const app = express();
const port = process.env.BACKEND_PORT || 3001;

const corsOptions = {
  origin: process.env.CORS_ORIGIN,
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());

// Routes
app.use("/api/flow", flowRoutes);
app.use("/api/onramp", onRampRoutes);
app.use("/api/offramp", offRampRoutes);
app.use("/api/swap", swapRoutes);
app.use("/api/swap", swapRoutes);

app.get("/", (req, res) => {
  res.send("Flow Backend is running!");
});

app.listen(port, () => {
  console.log(`Backend server listening at http://localhost:${port}`);
});
