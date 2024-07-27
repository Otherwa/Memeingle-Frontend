const mongoose = require('mongoose');

// Define the message schema
const messageSchema = new mongoose.Schema({
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    message: { type: String, required: true },
    timestamp: { type: Date, default: Date.now }
});

// Ensure virtual fields are serialized
messageSchema.set('toJSON', { virtuals: true });
messageSchema.set('toObject', { virtuals: true });


const Message = mongoose.model('Message', messageSchema);

module.exports = Message;
