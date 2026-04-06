const User = require('../models/User');

// POST /api/users/register
exports.registerUser = async (req, res) => {
    try {
        const { username, salt } = req.body;
        
        // Basic validation
        if (!username || !salt) {
            return res.status(400).json({ message: "Username and salt are required" });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(400).json({ message: "Username already taken" });
        }

        // Create and save new user
        const newUser = new User({ username, salt });
        await newUser.save();

        res.status(201).json({ message: "User registered successfully", username: newUser.username });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// GET /api/users/:username/salt
exports.getUserSalt = async (req, res) => {
    try {
        const user = await User.findOne({ username: req.params.username });
        
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        res.status(200).json({ salt: user.salt });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};