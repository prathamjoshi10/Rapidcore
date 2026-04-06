const express = require("express");
const router = express.Router();

const {
  getVaultStatus,
  createVaultAccount,
  verifyRecoveryKey,
  resetVaultAccount,
} = require("../controllers/vault.controller");

router.get("/", getVaultStatus);
router.post("/", createVaultAccount);
router.post("/verify-recovery", verifyRecoveryKey);
router.post("/reset", resetVaultAccount);

module.exports = router;
