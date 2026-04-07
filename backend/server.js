const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
require("dotenv").config();

const connectDB = require("./config/db");
const errorHandler = require("./middleware/errorHandler");

const app = express();
app.use(helmet());

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

app.use(express.json({ limit: "10mb" }));
app.get("/", (req, res) => {
  res.json({
    message: "SecureVault API is running",
    status: "ok",
    timestamp: new Date().toISOString(),
  });
});

app.get("/health", (req, res) => {
  res.send("Server is running");
});
app.use("/api/vault", require("./routes/vault.routes"));
app.use("/", require("./routes/vaultData.routes"));
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

app.use(errorHandler);
const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀  SecureVault API running on port ${PORT}`);
  });
});
