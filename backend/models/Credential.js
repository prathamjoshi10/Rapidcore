const mongoose = require("mongoose");

const credentialSchema = new mongoose.Schema(
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
      required: [true, "Username is required"],
      trim: true,
    },
    encryptedPassword: {
      type: String,
      required: [true, "Encrypted password is required"],
    },
    iv: {
      type: String,
      required: [true, "Initialization vector (IV) is required"],
    },
    notes: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for faster queries per user
credentialSchema.index({ userId: 1, platform: 1 });

module.exports = mongoose.model("Credential", credentialSchema);
