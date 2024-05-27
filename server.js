// server.js
require('dotenv').config()

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const memeRoutes = require('./routes/memeRoutes');

const app = express();

// Middleware
// Enable CORS for all routes
app.use(cors());
// ! load
app.use(express.json({ limit: '50mb' }));

// Routes
app.use('/api', authRoutes);
app.use('/api', userRoutes);
app.use('/api', memeRoutes);

app.get('/', (req, res) => {
    res.status(200).json({ "msg": `runing ${PORT}` })
})

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => {
    console.log('Connected to MongoDB');
}).catch(err => console.error('Error connecting to MongoDB:', err));

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
