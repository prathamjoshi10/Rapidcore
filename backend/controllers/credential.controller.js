const Credential = require("../models/Credential");

// @desc    Store a new encrypted credential
// @route   POST /api/credentials
exports.storeCredential = async (req, res, next) => {
  try {
    const { userId, platform, platformUrl, username, encryptedPassword, iv, notes } = req.body;

    // Validate required fields
    if (!userId || !platform || !username || !encryptedPassword || !iv) {
      return res.status(400).json({
        error: "Missing required fields: userId, platform, username, encryptedPassword, iv",
      });
    }

    const credential = await Credential.create({
      userId,
      platform,
      platformUrl: platformUrl || "",
      username,
      encryptedPassword,
      iv,
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

// @desc    Retrieve all credentials for a user
// @route   GET /api/credentials?userId=xxx
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

// @desc    Retrieve a single credential by ID
// @route   GET /api/credentials/:id
exports.getCredentialById = async (req, res, next) => {
  try {
    const credential = await Credential.findById(req.params.id).select("-__v");

    if (!credential) {
      return res.status(404).json({ error: "Credential not found" });
    }

    res.json({ credential });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a credential
// @route   PUT /api/credentials/:id
exports.updateCredential = async (req, res, next) => {
  try {
    const { platform, platformUrl, username, encryptedPassword, iv, notes } = req.body;

    const credential = await Credential.findById(req.params.id).select("-__v");

    if (!credential) {
      return res.status(404).json({ error: "Credential not found" });
    }

    // Update only provided fields
    if (platform !== undefined) credential.platform = platform;
    if (platformUrl !== undefined) credential.platformUrl = platformUrl;
    if (username !== undefined) credential.username = username;
    if (encryptedPassword !== undefined) credential.encryptedPassword = encryptedPassword;
    if (iv !== undefined) credential.iv = iv;
    if (notes !== undefined) credential.notes = notes;

    await credential.save();

    res.json({
      message: "Credential updated successfully",
      credential,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a credential
// @route   DELETE /api/credentials/:id
exports.deleteCredential = async (req, res, next) => {
  try {
    const credential = await Credential.findByIdAndDelete(req.params.id);

    if (!credential) {
      return res.status(404).json({ error: "Credential not found" });
    }

    res.json({ message: "Credential deleted successfully" });
  } catch (error) {
    next(error);
  }
};

// @desc    Search credentials by platform name
// @route   GET /api/credentials/search?userId=xxx&q=github
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
