const Credential = require("../models/Credential");

function findCredentialForUser(id, userId) {
  return Credential.findOne({ _id: id, userId }).select("-__v");
}

exports.storeCredential = async (req, res, next) => {
  try {
    const { userId, platform, platformUrl, username, encryptedUsername, usernameIv, encryptedPassword, iv, salt, notes } = req.body;

    if (!userId || !platform || !encryptedPassword || !iv || !salt) {
      return res.status(400).json({
        error: "Missing required fields: userId, platform, encryptedPassword, iv, salt",
      });
    }

    const credential = await Credential.create({
      userId,
      platform,
      platformUrl: platformUrl || "",
      username: username || "",
      encryptedUsername: encryptedUsername || "",
      usernameIv: usernameIv || "",
      encryptedPassword,
      iv,
      salt,
      notes: notes || "",
    });

    res.status(201).json({
      message: "Credential stored successfully",
      credential,
    });
  } catch (error) {
    next(error);
  }
};

exports.getAllCredentials = async (req, res, next) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ error: "userId query parameter is required" });
    }

    const credentials = await Credential.find({ userId }).select("-__v").sort({ updatedAt: -1 });

    res.json({
      count: credentials.length,
      credentials,
    });
  } catch (error) {
    next(error);
  }
};

exports.getCredentialById = async (req, res, next) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ error: "userId query parameter is required" });
    }

    const credential = await findCredentialForUser(req.params.id, userId);

    if (!credential) {
      return res.status(404).json({ error: "Credential not found" });
    }

    res.json({ credential });
  } catch (error) {
    next(error);
  }
};

exports.updateCredential = async (req, res, next) => {
  try {
    const { userId, platform, platformUrl, username, encryptedUsername, usernameIv, encryptedPassword, iv, notes } = req.body;

    if (!userId) {
      return res.status(400).json({ error: "userId is required" });
    }

    const credential = await findCredentialForUser(req.params.id, userId);

    if (!credential) {
      return res.status(404).json({ error: "Credential not found" });
    }

    if (platform !== undefined) credential.platform = platform;
    if (platformUrl !== undefined) credential.platformUrl = platformUrl;
    if (username !== undefined) credential.username = username;
    if (encryptedUsername !== undefined) credential.encryptedUsername = encryptedUsername;
    if (usernameIv !== undefined) credential.usernameIv = usernameIv;
    if (encryptedPassword !== undefined) credential.encryptedPassword = encryptedPassword;
    if (iv !== undefined) credential.iv = iv;
    if (notes !== undefined) credential.notes = notes;
    if (req.body.salt !== undefined) credential.salt = req.body.salt;

    await credential.save();

    res.json({
      message: "Credential updated successfully",
      credential,
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteCredential = async (req, res, next) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ error: "userId query parameter is required" });
    }

    const credential = await Credential.findOneAndDelete({ _id: req.params.id, userId });

    if (!credential) {
      return res.status(404).json({ error: "Credential not found" });
    }

    res.json({ message: "Credential deleted successfully" });
  } catch (error) {
    next(error);
  }
};

exports.searchCredentials = async (req, res, next) => {
  try {
    const { userId, q } = req.query;

    if (!userId) {
      return res.status(400).json({ error: "userId query parameter is required" });
    }

    if (!q) {
      return res.status(400).json({ error: "Search query (q) is required" });
    }

    const credentials = await Credential.find({
      userId,
      platform: { $regex: q, $options: "i" },
    }).select("-__v").sort({ updatedAt: -1 });

    res.json({
      count: credentials.length,
      credentials,
    });
  } catch (error) {
    next(error);
  }
};

exports.trackUsage = async (req, res, next) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: "userId is required" });
    }

    const credential = await Credential.findOneAndUpdate(
      { _id: req.params.id, userId },
      {
        $inc: { usageCount: 1 },
        $set: { lastUsed: new Date() },
      },
      { new: true }
    ).select("-__v");

    if (!credential) {
      return res.status(404).json({ error: "Credential not found" });
    }

    res.json({
      message: "Usage tracked",
      credential,
    });
  } catch (error) {
    next(error);
  }
};
