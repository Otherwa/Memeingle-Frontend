// ? ? routes/userRoutes.js

// ? ? Required modules
require('dotenv').config(); // ? ? Load environment variables
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth'); // ? ? Middleware to verify JWT token
const User = require('../models/User');
const Meme = require('../models/Meme');
const axios = require('axios');
const multer = require('multer');
const moment = require('moment');
const mongoose = require('mongoose');
const Grid = require('gridfs-stream');
const { Readable } = require('stream');

// ? Initialize GridFS
const conn = mongoose.connection;
let gfs, gridFSBucket;

conn.once('open', () => {
    gfs = Grid(conn.db, mongoose.mongo);
    gfs.collection('avatars');  // ? Set the collection to store avatars
    gridFSBucket = new mongoose.mongo.GridFSBucket(conn.db, {
        bucketName: 'avatars'  // ? Ensure the bucket name is consistent
    });
});

const upload = multer();

var count = 0

router.get('/ping', auth, (req, res) => {
    count++;
})

router.get('/unping', auth, (req, res) => {
    count--;
})


router.get('/count', auth, (req, res) => {
    const activeUserCount = count;
    res.json({ count: activeUserCount });
})

// ? ? Update User Data
router.post('/user', auth, upload.single('avatar'), async (req, res) => {
    const { hobbies, bio, gender } = req.body;
    let avatar = null;

    try {
        if (req.file) {
            // ? Create a readable stream from the buffer
            const readableAvatarStream = new Readable();
            readableAvatarStream.push(req.file.buffer);
            readableAvatarStream.push(null); // ? End the stream

            // ? Define a filename
            const avatarFileName = `${req.user.id}-${Date.now()}.png`;

            // ? Check if the user already has an avatar, if so delete the old one
            const user = await User.findById(req.user.id);
            if (user.avatar) {
                console.log(user.avatar)
                await gfs.files.deleteOne({ filename: user.avatar });
            }

            // ? Store the new avatar in GridFS
            const uploadStream = gridFSBucket.openUploadStream(avatarFileName);
            readableAvatarStream.pipe(uploadStream);

            // ? Wait until the stream finishes
            await new Promise((resolve, reject) => {
                uploadStream.on('finish', resolve);
                uploadStream.on('error', reject);
            });

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

// ? ? Fetch User Data
router.get('/user', auth, async (req, res) => {
    try {
        let user = await User.findById(req.user.id).select('-password');

        const memeIdToLikedAtMap = new Map(
            user.details.liked.map(item => [item.meme.toString(), item.likedAt])
        );

        user.details.liked = null;

        // ? Fetching memes liked by the user
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

        // ? Fetch avatar from GridFS
        let avatarBase64 = null;
        if (user.avatar) {
            try {
                const downloadStream = gridFSBucket.openDownloadStreamByName(user.avatar);

                let chunks = [];
                downloadStream.on('data', (chunk) => {
                    chunks.push(chunk);
                });

                await new Promise((resolve, reject) => {
                    downloadStream.on('end', () => {
                        const buffer = Buffer.concat(chunks);
                        avatarBase64 = buffer.toString('base64');
                        resolve();
                    });
                    downloadStream.on('error', reject);
                });
            } catch (err) {
                console.error('Error fetching avatar:', err);
            }
        }

        const response = {
            user: {
                ...user.toObject(),
                avatarBase64, // ? Add the avatar Base64 to the user data
            },
            UserStats
        };

        res.json(response);

    } catch (error) {
        console.error('Error fetching user data:', error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});

// ? ? Fetch user data by ID
router.post('/user/:id', auth, async (req, res) => {
    try {
        const { id } = req.params;
        let user = await User.findById(id).select('-password');

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        let avatarBase64 = null;
        console.log("Data" + user);
        if (user.avatar) {
            console.log(user.avatar)
            try {
                const downloadStream = gridFSBucket.openDownloadStreamByName(user.avatar);

                let chunks = [];
                downloadStream.on('data', (chunk) => {
                    chunks.push(chunk);
                });

                await new Promise((resolve, reject) => {
                    downloadStream.on('end', () => {
                        const buffer = Buffer.concat(chunks);
                        avatarBase64 = buffer.toString('base64');
                        resolve();
                    });
                    downloadStream.on('error', reject);
                });
            } catch (err) {
                console.error('Error fetching avatar:', err);
            }
        }

        const APP_ENGINE_URL = process.env.APP_ENGINE_URL;
        const resp = await axios.get(`${APP_ENGINE_URL}predict-personality/${id}`);
        const data = resp.data;
        const response = {
            "user": {
                ...user.toObject(),
                data,
                avatarBase64,
            }
        };
        console.log(response);
        res.json(response);

    } catch (error) {
        console.error('Error fetching user data by ID:', error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});

// ? ? Get similar users based on interests
router.get('/user/peep/:id', auth, async (req, res) => {
    try {
        const userId = req.params.id;
        const peep = await User.findById(userId, { liked: 0, password: 0 });

        if (!peep) {
            return res.json({ peep: null });
        }

        let avatarBase64 = null;
        if (peep.avatar) {
            try {
                const downloadStream = gridFSBucket.openDownloadStreamByName(peep.avatar);

                let chunks = [];
                downloadStream.on('data', (chunk) => {
                    chunks.push(chunk);
                });

                await new Promise((resolve, reject) => {
                    downloadStream.on('end', () => {
                        const buffer = Buffer.concat(chunks);
                        avatarBase64 = buffer.toString('base64');
                        resolve();
                    });
                    downloadStream.on('error', reject);
                });
            } catch (err) {
                console.error('Error fetching avatar:', err);
            }
        }

        res.json({
            "peep": {
                ...peep.toObject(),
                avatarBase64,
            }
        });

    } catch (error) {
        console.error('Error fetching similar users:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// ? ? Get similar users based on interests from an external service
router.get('/user/peeps', auth, async (req, res) => {
    try {
        const APP_ENGINE_URL = process.env.APP_ENGINE_URL;
        const userId = req.user.id;

        const response = await axios.get(`${APP_ENGINE_URL}similar/${userId}`);
        const similarPeeps = response.data;

        const similarPeepIds = Object.keys(similarPeeps.data);

        const peeps = await User.find(
            { _id: { $in: similarPeepIds } },
            { liked: 0, password: 0 }
        );

        const similarityMap = new Map(Object.entries(similarPeeps.data));
        const combinedData = peeps.map(user => {
            const similarityScore = similarityMap.get(user._id.toString()) || null;
            return { ...user.toObject(), similarityScore };
        });

        combinedData.sort((a, b) => b.similarityScore - a.similarityScore);

        res.json({ peeps: combinedData });
    } catch (error) {
        console.error('Error fetching similar peeps:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

module.exports = router;
