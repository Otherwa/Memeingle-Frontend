const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Define the meme schema
const memeSchema = new Schema({
    Title: { type: String, required: true },
    Author: { type: String, required: true },
    Url: { type: String, required: true },
    Subreddit: { type: String, required: true },
    UpVotes: { type: Number, required: true },
    liked: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
});

// Create a Mongoose model from the schema
const Meme = mongoose.model('Meme', memeSchema);

module.exports = Meme;
