const mongoose = require('mongoose');
const Schema = mongoose.Schema;



// Define the message schema
const messageSchema = new Schema({
    from: {
        type: String,
        required: true,  // The sender of the message
    },
    to: {
        type: String,
        required: true,  // The recipient of the message
    },
    message: {
        type: String,
        required: true,  // The content of the message
    },
    timestamp: {
        type: Date,
        default: Date.now,  // Automatically set the timestamp to the current date and time
    },
});

// Ensure virtual fields are serialized
messageSchema.set('toJSON', { virtuals: true });
messageSchema.set('toObject', { virtuals: true });


const Message = mongoose.model('Message', messageSchema);

module.exports = Message;
