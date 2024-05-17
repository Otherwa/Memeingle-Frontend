// routes/userRoutes.js

const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth'); // Middleware to verify JWT token
const User = require('../models/User');
const Meme = require('../models/Meme');

// Get user data
router.get('/user', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        const userStats = await Meme.find({ liked: req.user.id }, { "Url": 1, "Title": 1, "Author": 1, "UpVotes": 1 },)
        const response = { user, userStats }

        res.json(response);

    } catch (error) {
        console.error('Error fetching user data:', error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});

module.exports = router;
