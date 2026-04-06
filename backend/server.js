const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
require("dotenv").config();

const connectDB = require("./config/db");
const errorHandler = require("./middleware/errorHandler");

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
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
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

// Health check (simple)
app.get("/health", (req, res) => {
  res.send("Server is running");
});

// MVP round-2 API routes
app.use("/", require("./routes/mvp.routes"));

// Credential routes
app.use("/api/credentials", require("./routes/credential.routes"));
app.use("/api/vault", require("./routes/vault.routes"));

// --------------- Error Handling ---------------
// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// Global error handler
app.use(errorHandler);

// --------------- Start Server ---------------
const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀  SecureVault API running on port ${PORT}`);
  });
});
