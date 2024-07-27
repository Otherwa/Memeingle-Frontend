require('dotenv').config();
const express = require('express');
const router = express.Router();
const Message = require('../models/Messages'); // Make sure this path is correct

// Function to fetch messages
const fetchMessages = async (from, to) => {
    try {
        const messages = await Message.find({
            $or: [
                { sender: from, recipient: to },
                { sender: to, recipient: from }
            ]
        }).sort({ timestamp: 1 });

        return messages;
    } catch (error) {
        console.error('Error fetching messages:', error);
        throw error;
    }
};

// Route to get messages between two users
router.get('/messages', async (req, res) => {
    const { from, to } = req.query;

    if (!from || !to) {
        return res.status(400).json({ error: 'Query parameters "from" and "to" are required.' });
    }

    try {
        const messages = await fetchMessages(from, to);
        res.json(messages);
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
});




module.exports = router;
