// routes/userRoutes.js
require('dotenv').config()

const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth'); // Middleware to verify JWT token
const User = require('../models/User');
const Meme = require('../models/Meme');
const axios = require('axios');

// Update User Data
router.post('/user', auth, async (req, res) => {
    const userData = req.body
    console.log(userData);
    const { hobbies, bio, gender, avatar } = userData.data;


    try {
        await User.findOneAndUpdate({ "_id": req.user.id }, { "hobbies": hobbies, "bio": bio, "gender": gender, "avatar": avatar });
        res.json({ msg: "Updated" })
    } catch (error) {
        console.error('Error fetching user data:', error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});

// Get user data
router.get('/user', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');

        const meme = user.liked.map(item => item.toString());

        const userStats = await Meme.find(
            { _id: { $in: meme } },
            { "Url": 1, "Title": 1, "Author": 1, "UpVotes": 1 }
        );
        const response = { user, userStats }

        res.json(response);

    } catch (error) {
        console.error('Error fetching user data:', error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});

// Get Similar Users based on your similar interests
router.get('/user/peeps', auth, async (req, res) => {
    try {
        const APP_ENGINE_URL = process.env.APP_ENGINE_URL;
        const userId = req.user.id;

        const response = await axios.get(`${APP_ENGINE_URL}similar/${userId}`);
        const similar_peeps = response.data;

        const similar_peeps_keys = Object.keys(similar_peeps.data);

        const peeps = await User.find(
            { _id: { $in: similar_peeps_keys } },
            { liked: 0, password: 0 }
        );

        // Convert similarityScores to a Map for quick lookups
        const similarityMap = new Map(Object.entries(similar_peeps.data));

        const combinedData = peeps.map(user => {
            const similarityScore = similarityMap.get(user._id.toString());
            return {
                ...user.toObject(),
                similarityScore: similarityScore !== undefined ? similarityScore : null
            };
        });

        combinedData.sort((a, b) => b.similarityScore - a.similarityScore);

        res.json({ peeps: combinedData });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
