// routes/userRoutes.js
require('dotenv').config()

const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth'); // Middleware to verify JWT token
const User = require('../models/User');
const Meme = require('../models/Meme');
const Message = require('../models/Messages');
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

// Post messaging user dat
router.post('/user/:id', auth, async (req, res) => {
    try {
        const { id } = req.params;
        const user = await User.findById(id).select('-password -liked');
        const response = { user }

        res.json(response);

    } catch (error) {
        console.error('Error fetching user data:', error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});

// Get Similar Users based on your similar interests
router.get('/user/peep/:id', auth, async (req, res) => {
    try {

        const userId = req.params.id;

        const peep = await User.find(
            { _id: userId },
            { liked: 0, password: 0 }
        );

        if (!peep) {
            res.json({ peeps: null })
        }


        res.json({ peep: peep });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
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


// GET messages by securityKey
router.get('/messages', async (req, res) => {
    const { securityKey } = req.query;
    const securityKeyDup = securityKey.split("_");
    const securityKeyRev = securityKeyDup[1] + "_" + securityKeyDup[0];

    console.log(securityKey)
    console.log(securityKeyRev)

    try {
        const messages_u1 = await Message.find({ 'securityKey': securityKey });
        const messages_u2 = await Message.find({ 'securityKey': securityKeyRev });
        const messages = [...messages_u1, ...messages_u2];

        messages.sort((a, b) => {
            return new Date(a.timestamp) - new Date(b.timestamp);
        });

        res.json(messages);
    } catch (error) {
        console.error('Error fetching messages:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// POST a new message
router.post('/messages', async (req, res) => {
    const { text, senderId, timestamp, securityKey } = req.body;
    console.log(req.body);
    try {
        const newMessage = new Message({ text, senderId, timestamp, securityKey });
        await newMessage.save();
        res.status(201).json(newMessage);
    } catch (error) {
        console.error('Error saving message:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

module.exports = router;
