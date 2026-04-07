const mongoose = require("mongoose");

const vaultSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: [true, "User ID is required"],
      unique: true,
      index: true,
    },
    vault: {
      type: String,
      default: "",
    },
    recoveryKeyHash: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.models.Vault || mongoose.model("Vault", vaultSchema);
