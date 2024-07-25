// models/User.js

const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    avatar: { type: String },
    likedmemes: { type: Number, default: 0 },
    details: {
        liked: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Meme' }],
        hobbies: { type: String },
        gender: { type: String },
        bio: { type: String }
    }
}, { timestamps: true });


// Ensure virtual fields are serialized
userSchema.set('toJSON', { virtuals: true });
userSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('User', userSchema);
