const crypto = require("crypto");
const VaultAccount = require("../models/VaultAccount");
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

    const account = await VaultAccount.findOne({ userId }).lean();
    const hasVaultEntries = !account && await Vault.exists({ userId });

    res.json({ exists: Boolean(account || hasVaultEntries) });
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

    const existingAccount = await VaultAccount.findOne({ userId }).lean();
    const existingVaultEntries = !existingAccount && await Vault.exists({ userId });
    if (existingAccount || existingVaultEntries) {
      return res.status(409).json({ error: "A vault account already exists for this master password." });
    }

    const recoveryKey = generateRecoveryKey();
    const account = await VaultAccount.create({
      userId,
      recoveryKeyHash: hashRecoveryKey(recoveryKey),
    });

    res.status(201).json({
      message: "Vault account created successfully",
      recoveryKey,
      accountId: account._id,
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

    const recoveryKeyHash = hashRecoveryKey(recoveryKey);
    const account = await VaultAccount.findOne({ userId, recoveryKeyHash }).lean();

    if (!account) {
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

    const recoveryKeyHash = hashRecoveryKey(recoveryKey);
    const account = await VaultAccount.findOne({ recoveryKeyHash });

    if (!account) {
      return res.status(404).json({ error: "Invalid recovery key" });
    }

    const conflictingAccount = await VaultAccount.findOne({ userId: newUserId, _id: { $ne: account._id } }).lean();
    if (conflictingAccount) {
      return res.status(409).json({ error: "That master password is already in use by another vault account." });
    }

    await Vault.deleteMany({ userId: account.userId });

    const nextRecoveryKey = generateRecoveryKey();
    account.userId = newUserId;
    account.recoveryKeyHash = hashRecoveryKey(nextRecoveryKey);
    await account.save();

    res.json({
      message: "Vault account reset successfully",
      recoveryKey: nextRecoveryKey,
    });
  } catch (error) {
    next(error);
  }
};
