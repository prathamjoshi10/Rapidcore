const express = require("express");
const router = express.Router();
const validateRequest = require("../middleware/validateRequest");

const {
  storeCredential,
  getAllCredentials,
  getCredentialById,
  updateCredential,
  deleteCredential,
  searchCredentials,
} = require("../controllers/credential.controller");

// Required fields for creating a credential
const storeFields = ["userId", "platform", "username", "encryptedPassword", "iv"];

// Search must come before /:id to avoid conflicts
router.get("/search", searchCredentials);

router.post("/", validateRequest(storeFields), storeCredential);
router.get("/", getAllCredentials);
router.get("/:id", getCredentialById);
router.put("/:id", updateCredential);
router.delete("/:id", deleteCredential);

module.exports = router;
