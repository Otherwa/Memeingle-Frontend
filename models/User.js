// models/User.js

const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    liked: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Meme' }],
    hobbies: { type: String },
    bio: { type: String },
    gender: { type: String },
    avatar: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
