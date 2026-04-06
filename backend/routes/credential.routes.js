const express = require("express");
const router = express.Router();

const {
  storeCredential,
  getAllCredentials,
  getCredentialById,
  updateCredential,
  deleteCredential,
  searchCredentials,
} = require("../controllers/credential.controller");

// Search must come before /:id to avoid conflicts
router.get("/search", searchCredentials);

router.post("/", storeCredential);
router.get("/", getAllCredentials);
router.get("/:id", getCredentialById);
router.put("/:id", updateCredential);
router.delete("/:id", deleteCredential);

module.exports = router;
