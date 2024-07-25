require('dotenv').config();
const express = require('express');
const router = express.Router();
const Message = require('../models/Messages'); // Make sure this path is correct

// Fetch messages between two users
router.get('/messages', async (req, res) => {
    const { from, to } = req.query;
    try {
        const messages = await Message.find({
            $or: [
                { from, to },
                { from: to, to: from },
            ],
        }).sort({ timestamp: 1 });
        res.json(messages);
    } catch (error) {
        console.error('Error fetching messages:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Post a new message
router.post('/messages', async (req, res) => {
    const { from, to, message, timestamp } = req.body;
    try {
        const newMessage = new Message({ from, to, message, timestamp });
        await newMessage.save();
        res.status(201).json(newMessage);
    } catch (error) {
        console.error('Error saving message:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

module.exports = router;
