require('dotenv').config(); // Load environment variables

const express = require('express');
const apicache = require('apicache');
const router = express.Router();
const auth = require('../middleware/auth'); // Middleware to verify JWT token
const User = require('../models/User');
const Meme = require('../models/Meme');
const axios = require('axios');


// Update User Data
router.post('/user', auth, async (req, res) => {
    const userData = req.body;
    console.log(userData);
    const { hobbies, bio, gender, avatar } = userData.data;

    try {

        await User.findOneAndUpdate(
            { "_id": req.user.id },
            {
                $set: {
                    "details.hobbies": hobbies,
                    "details.bio": bio,
                    "details.gender": gender,
                    "avatar": avatar
                }
            },
        );

        apicache.clear(`/user/${req.user.id}`); // Clear cache for this user
        res.json({ msg: "Updated" });
    } catch (error) {
        console.error('Error updating user data:', error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});

router.get('/memelist', auth, async (req, res) => {
    try {
        const APP_ENGINE_URL = process.env.APP_ENGINE_URL;
        const userId = req.user.id;
        const userEmail = req.user.email;
        console.log(userEmail + ` Fetched MemeList`);

        // Call the FastAPI endpoint to get the list of memes
        const response = await axios.get(APP_ENGINE_URL + `recommendations/${userId}`);
        const recommendations = response.data.recommendations;
        console.log(recommendations)
        // Fetch memes from MongoDB based on the recommendation IDs
        const memes = await Meme.find({ _id: { $in: recommendations } }, { "_id": 1, "Url": 1, "Title": 1, "Author": 1, "UpVotes": 1 });

        memes.sort(() => Math.random() - 0.5);

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

        console.log(`Meme Liked ${memeId} by ${JSON.stringify(req.user)}`);
        // Update the user to add the user ID to the liked array
        await User.updateOne(
            { _id: userId },
            {
                $push: { "details.liked": { 'meme': memeId, likedAt: new Date() } },
                $inc: { likedmemes: 1 }
            },
        );
        // Update the meme upvote count
        await Meme.updateOne({ _id: memeId }, { $inc: { UpVotes: 1 } });

        res.json({ message: "Meme liked successfully" });
    } catch (error) {
        console.error("Error liking meme:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});

module.exports = router;
