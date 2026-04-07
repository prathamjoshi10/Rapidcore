const Vault = require("../models/Vault");
exports.getVaultData = async (req, res, next) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ error: "userId query parameter is required" });
    }

    const doc = await Vault.findOne({ userId }).lean();

    if (!doc) {
      return res.status(404).json({ error: "Vault not found" });
    }

    res.json({ vault: doc.vault || "" });
  } catch (error) {
    next(error);
  }
};
exports.saveVaultData = async (req, res, next) => {
  try {
    const { userId, vault } = req.body;

    if (!userId) {
      return res.status(400).json({ error: "userId is required" });
    }

    if (typeof vault !== "string") {
      return res.status(400).json({ error: "vault must be a Base64 string" });
    }

    const doc = await Vault.findOneAndUpdate(
      { userId },
      { vault },
      { new: true, upsert: true }
    );

    res.json({ message: "Vault saved successfully", updatedAt: doc.updatedAt });
  } catch (error) {
    next(error);
  }
};
