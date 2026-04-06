const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
require("dotenv").config();

const connectDB = require("./config/db");

// Initialize Express app
const app = express();

// --------------- Middleware ---------------
// Security headers
app.use(helmet());

// CORS configuration
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",")
  : ["http://localhost:3000"];

app.use(
  cors({
    origin: allowedOrigins,
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);

// Parse JSON bodies
app.use(express.json());

// --------------- Routes ---------------
// Health check
app.get("/", (req, res) => {
  res.json({
    message: "SecureVault API is running",
    status: "ok",
    timestamp: new Date().toISOString(),
  });
});

// Credential routes (will be added in next batch)
// app.use("/api/credentials", require("./routes/credential.routes"));

// --------------- Error Handling ---------------
// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(`❌  Error: ${err.message}`);
  res.status(err.status || 500).json({
    error: err.message || "Internal Server Error",
  });
});

// --------------- Start Server ---------------
const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀  SecureVault API running on port ${PORT}`);
  });
});
