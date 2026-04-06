const express = require('express');
const router = express.Router();
const { registerUser, getUserSalt } = require('../controllers/user.controller');

// Route: POST /api/users/register
router.post('/register', registerUser);

// Route: GET /api/users/:username/salt
router.get('/:username/salt', getUserSalt);

module.exports = router;