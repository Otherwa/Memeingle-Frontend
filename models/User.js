// models/User.js
const mongoose = require('mongoose');


const likedMemeSchema = new mongoose.Schema({
    meme: { type: mongoose.Schema.Types.ObjectId, ref: 'Meme' },
    likedAt: { type: Date, default: Date.now }
}, { _id: false, timestamps: true });

const userSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    avatar: { type: String },
    likedmemes: { type: Number, default: 0 },
    details: {
        liked: [likedMemeSchema],
        hobbies: { type: String },
        gender: { type: String },
        bio: { type: String }
    }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);

// Ensure virtual fields are serialized
userSchema.set('toJSON', { virtuals: true });
userSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('User', userSchema);
