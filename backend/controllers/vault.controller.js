const crypto = require("crypto");
const Vault = require("../models/Vault");

function hashRecoveryKey(recoveryKey) {
  return crypto.createHash("sha256").update(recoveryKey).digest("hex");
}

function generateRecoveryKey() {
  return crypto.randomBytes(18).toString("base64url");
}
exports.getVaultStatus = async (req, res, next) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ error: "userId query parameter is required" });
    }

    const doc = await Vault.findOne({ userId }).lean();
    res.json({ exists: Boolean(doc) });
  } catch (error) {
    next(error);
  }
};
exports.createVaultAccount = async (req, res, next) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: "userId is required" });
    }

    const existing = await Vault.findOne({ userId }).lean();
    if (existing) {
      return res.status(409).json({ error: "A vault account already exists for this master password." });
    }

    const recoveryKey = generateRecoveryKey();
    await Vault.create({
      userId,
      vault: "",
      recoveryKeyHash: hashRecoveryKey(recoveryKey),
    });

    res.status(201).json({
      message: "Vault account created successfully",
      recoveryKey,
    });
  } catch (error) {
    next(error);
  }
};
exports.verifyRecoveryKey = async (req, res, next) => {
  try {
    const { recoveryKey, userId } = req.body;

    if (!recoveryKey || !userId) {
      return res.status(400).json({ error: "recoveryKey and userId are required" });
    }

    const doc = await Vault.findOne({
      userId,
      recoveryKeyHash: hashRecoveryKey(recoveryKey),
    }).lean();

    if (!doc) {
      return res.status(404).json({ error: "Invalid recovery key" });
    }

    res.json({ valid: true });
  } catch (error) {
    next(error);
  }
};
exports.resetVaultAccount = async (req, res, next) => {
  try {
    const { recoveryKey, newUserId } = req.body;

    if (!recoveryKey || !newUserId) {
      return res.status(400).json({ error: "recoveryKey and newUserId are required" });
    }

    const doc = await Vault.findOne({
      recoveryKeyHash: hashRecoveryKey(recoveryKey),
    });

    if (!doc) {
      return res.status(404).json({ error: "Invalid recovery key" });
    }

    const conflict = await Vault.findOne({
      userId: newUserId,
      _id: { $ne: doc._id },
    }).lean();

    if (conflict) {
      return res.status(409).json({ error: "That master password is already in use." });
    }

    const nextRecoveryKey = generateRecoveryKey();
    doc.userId = newUserId;
    doc.vault = ""; // wipe credentials on reset
    doc.recoveryKeyHash = hashRecoveryKey(nextRecoveryKey);
    await doc.save();

    res.json({
      message: "Vault account reset successfully",
      recoveryKey: nextRecoveryKey,
    });
  } catch (error) {
    next(error);
  }
};
