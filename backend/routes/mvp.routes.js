const express = require("express");
const router = express.Router();

const validateRequest = require("../middleware/validateRequest");
const { storeCredential, getAllCredentials, getCredentialById } = require("../controllers/credential.controller");

const storeFields = ["userId", "platform", "encryptedPassword", "iv", "salt"];

router.post("/store", validateRequest(storeFields), storeCredential);
router.get("/retrieve", getAllCredentials);
router.get("/retrieve/:id", getCredentialById);

module.exports = router;
