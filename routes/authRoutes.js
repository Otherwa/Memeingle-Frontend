// routes/authRoutes.js
require('dotenv').config()

const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

router.post('/register', async (req, res) => {
    try {
        const { email, password } = req.body;
        // Check if user already exists
        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ message: "User already exists" });
        }
        // Create new user
        const INTIAL_MEMELIKED_ID = '664626828f760c694ebd9767';
        const first_meme = {
            meme: INTIAL_MEMELIKED_ID,
            likedAt: new Date()
        }
        user = new User({ email, password, 'details.liked': [first_meme] });
        // Hash password
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);
        // Save user to database

        await user.save();
        res.status(201).json({ message: "User registered successfully" });
    } catch (error) {
        console.error('Error registering user:', error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});

router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        // Check if user exists
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: "Invalid credentials" });
        }
        // Check password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Invalid credentials" });
        }
        // Generate JWT token
        const payload = { user: { id: user.id, email: user.email } };
        const token = jwt.sign(payload, 'Tatakae', { expiresIn: 216000 }); // Change secret and expiration
        res.json({ token });
    } catch (error) {
        console.error('Error logging in user:', error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});

module.exports = router;
