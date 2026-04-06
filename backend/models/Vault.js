const mongoose = require("mongoose");

const vaultSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: [true, "User ID is required"],
      index: true,
    },
    platform: {
      type: String,
      required: [true, "Platform name is required"],
      trim: true,
      index: true,
    },
    platformUrl: {
      type: String,
      trim: true,
      default: "",
    },
    username: {
      type: String,
      trim: true,
      default: "",
    },
    encryptedUsername: {
      type: String,
      default: "",
    },
    usernameIv: {
      type: String,
      default: "",
    },
    encryptedPassword: {
      type: String,
      required: [true, "Encrypted password is required"],
    },
    iv: {
      type: String,
      required: [true, "Initialization vector (IV) is required"],
    },
    salt: {
      type: String,
      required: [true, "Salt is required for key derivation"],
    },
    notes: {
      type: String,
      default: "",
    },
    lastUsed: {
      type: Date,
      default: null,
    },
    usageCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

vaultSchema.index({ userId: 1, platform: 1 });

module.exports = mongoose.models.Vault || mongoose.model("Vault", vaultSchema);
