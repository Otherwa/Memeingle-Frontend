// ? routes/userRoutes.js

// ? Required modules
require('dotenv').config(); // ? Load environment variables
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth'); // ? Middleware to verify JWT token
const User = require('../models/User');
const Meme = require('../models/Meme');
const { Deta } = require('deta');
const axios = require('axios');
const multer = require('multer');
const moment = require('moment');

const deta = Deta(process.env.DETA_KEY);
const drive = deta.Drive('user_profile');

const upload = multer();

// ? Update User Data
router.post('/user', auth, upload.single('avatar'), async (req, res) => {
    const { hobbies, bio, gender } = req.body;
    let avatar = null;

    try {
        if (req.file) {
            // Store the avatar in Deta Drive
            const buffer = req.file.buffer;
            const avatarFileName = `${req.user.id}-${Date.now()}.png`;
            await drive.put(avatarFileName, { data: buffer });

            const user = await User.findById({ "_id": req.user.id })
            if (user.avatar) {
                await drive.delete(user.avatar);
            }

            avatar = avatarFileName;
        }

        await User.findOneAndUpdate(
            { "_id": req.user.id },
            {
                $set: {
                    "details.hobbies": hobbies,
                    "details.bio": bio,
                    "details.gender": gender,
                    "avatar": avatar
                }
            }
        );

        res.json({ msg: "Updated" });
    } catch (error) {
        console.error('Error updating user data:', error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});

// ? Fetch User Data
router.get('/user', auth, async (req, res) => {
    try {
        let user = await User.findById(req.user.id).select('-password');

        const memeIdToLikedAtMap = new Map(
            user.details.liked.map(item => [item.meme.toString(), item.likedAt])
        );

        user.details.liked = null;

        // Fetching memes liked by the user
        const userStats = await Meme.find(
            { _id: { $in: Array.from(memeIdToLikedAtMap.keys()) } },
            { "Url": 1, "Title": 1, "Author": 1, "UpVotes": 1 }
        );


        const UserStats = userStats.map(item => {
            const likedAt = memeIdToLikedAtMap.get(item._id.toString());
            const localLikedAt = likedAt ? moment(likedAt).format('MMM Do YY') : null;

            return {
                ...item.toObject(),
                likedAt: localLikedAt
            };
        });

        // ? Fetch avatar URL from Deta Drive
        let avatarBase64 = null;
        if (user.avatar) {
            try {
                const avatarResponse = await drive.get(user.avatar);
                if (avatarResponse) {
                    const buffer = await avatarResponse.arrayBuffer();
                    avatarBase64 = Buffer.from(buffer).toString('base64');
                }
            } catch (err) {
                console.error('Error fetching avatar:', err);
            }
        }

        const response = {
            user: {
                ...user.toObject(),
                avatarBase64, // Add the avatar Base64 to the user data
            },
            UserStats
        };

        res.json(response);

    } catch (error) {
        console.error('Error fetching user data:', error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});

// ? Fetch user data by ID
router.post('/user/:id', auth, async (req, res) => {
    try {
        const { id } = req.params;
        let user = await User.findById(id).select('-password');

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Assign likedmemes property to user object
        user.details.liked = null;

        let avatarBase64 = null;
        if (user.avatar) {
            try {
                const avatarResponse = await drive.get(user.avatar);
                if (avatarResponse) {
                    const buffer = await avatarResponse.arrayBuffer();
                    avatarBase64 = Buffer.from(buffer).toString('base64');
                }
            } catch (err) {
                console.error('Error fetching avatar:', err);
            }
        }

        const APP_ENGINE_URL = process.env.APP_ENGINE_URL;
        const resp = await axios.get(APP_ENGINE_URL + `predict-personality/${id}`);
        const data = resp.data
        const response = {
            "user":
            {
                ...user.toObject(),
                data,
                avatarBase64, // Add the avatar Base64 to the user data
            }
        };
        console.log(response);
        res.json(response); // Send the response with user object including likedmemes

    } catch (error) {
        console.error('Error fetching user data by ID:', error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});



// ? Get similar users based on interests
router.get('/user/peep/:id', auth, async (req, res) => {
    try {

        const userId = req.params.id;
        const peep = await User.findById(userId, { liked: 0, password: 0 });

        // get form flask
        if (!peep) {
            return res.json({ peep: null });
        }

        let avatarBase64 = null;
        if (peep.avatar) {
            try {
                const avatarResponse = await drive.get(user.avatar);
                if (avatarResponse) {
                    const buffer = await avatarResponse.arrayBuffer();
                    avatarBase64 = Buffer.from(buffer).toString('base64');
                }
            } catch (err) {
                console.error('Error fetching avatar:', err);
            }
        }

        res.json(
            {
                "peep":
                {
                    ...peep.toObject(),
                    avatarBase64,
                }
            }
        );

    } catch (error) {
        console.error('Error fetching similar users:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// ? Get similar users based on interests from an external service
router.get('/user/peeps', auth, async (req, res) => {
    try {
        const APP_ENGINE_URL = process.env.APP_ENGINE_URL;
        const userId = req.user.id;

        // ? Fetching similar peeps data from an external service
        const response = await axios.get(`${APP_ENGINE_URL}similar/${userId}`);
        const similarPeeps = response.data;

        const similarPeepIds = Object.keys(similarPeeps.data);
        console.log(similarPeepIds)
        // ? Fetching user data for similar peeps
        const peeps = await User.find(
            { _id: { $in: similarPeepIds } },
            { liked: 0, password: 0 }
        );

        // ? Mapping similarity scores to each user
        const similarityMap = new Map(Object.entries(similarPeeps.data));
        const combinedData = peeps.map(user => {
            const similarityScore = similarityMap.get(user._id.toString()) || null;

            return { ...user.toObject(), similarityScore };
        });

        // ? Sorting users by similarity score
        combinedData.sort((a, b) => b.similarityScore - a.similarityScore);

        res.json({ peeps: combinedData });
    } catch (error) {
        console.error('Error fetching similar peeps:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

module.exports = router;
