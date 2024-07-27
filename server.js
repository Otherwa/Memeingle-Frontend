require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const messageRoutes = require('./routes/messageRoutes');
const userRoutes = require('./routes/userRoutes');
const memeRoutes = require('./routes/memeRoutes');

const initSocketServer = require('./socketserver');

const app = express();
const server = http.createServer(app);
const io = initSocketServer(server);

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Routes
app.use('/api', authRoutes);
app.use('/api', userRoutes);
app.use('/api', memeRoutes);
app.use('/api', messageRoutes);

app.get('/', (req, res) => {
    res.status(200).json({ "msg": `running ${PORT}` });
});

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => {
    console.log('Connected to MongoDB');
}).catch(err => console.error('Error connecting to MongoDB:', err));

// Start server
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
