const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth'); // Middleware to verify JWT token
const Meme = require('../models/Meme');
const User = require('../models/User');
const axios = require('axios');

// Get user data

router.get('/memelist', auth, async (req, res) => {
    try {
        const APP_ENGINE_URL = process.env.APP_ENGINE_URL;
        const userId = req.user.id;
        const userEmail = req.user.email;
        console.log(userEmail);
        // Call the FastAPI endpoint to get the list of memes
        const response = await axios.get(APP_ENGINE_URL + `recommendations/${userId}`);
        const recommendations = response.data.recommendations;

        // Fetch memes from MongoDB based on the recommendation IDs
        const memes = await Meme.find({ _id: { $in: recommendations } }, { "_id": 1, "Url": 1, "Title": 1, "Author": 1, "UpVotes": 1 });

        res.json(memes);
    } catch (error) {
        console.error("Error fetching meme list:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});

router.post('/like/:id', auth, async (req, res) => {
    try {
        const memeId = req.params.id;
        const userId = req.user.id; // Assuming you have user information in the request object after authentication

        // Check if the user has already liked the meme
        const alreadyLiked = await Meme.exists({ _id: memeId, liked: userId });
        if (alreadyLiked) {
            return res.status(400).json({ message: "User already liked this meme" });
        }

        console.log(`Meme Liked ${memeId} by ${JSON.stringify(req.user)}`);
        // Update the user to add the user ID to the liked array
        await User.updateOne({ _id: userId }, { $push: { liked: memeId }, })
        // Update the meme upvote count
        await Meme.updateOne({ _id: memeId }, { $inc: { UpVotes: 1 } });

        res.json({ message: "Meme liked successfully" });
    } catch (error) {
        console.error("Error liking meme:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});


module.exports = router;