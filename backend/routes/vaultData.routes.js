const express = require("express");
const router = express.Router();

const {
  getVaultData,
  saveVaultData,
} = require("../controllers/vaultData.controller");
router.post("/store", saveVaultData);
router.get("/retrieve", getVaultData);

module.exports = router;
