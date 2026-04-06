const express = require("express");
const router = express.Router();

const {
  getVaultStatus,
  createVaultAccount,
  resetVaultAccount,
} = require("../controllers/vault.controller");

router.get("/", getVaultStatus);
router.post("/", createVaultAccount);
router.post("/reset", resetVaultAccount);

module.exports = router;
