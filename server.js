// server.js
require('dotenv').config()

const express = require('express');
const mongoose = require('mongoose');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const messageRoutes = require('./routes/messageRoutes');
const userRoutes = require('./routes/userRoutes');
const memeRoutes = require('./routes/memeRoutes');

const Message = require('./models/Messages');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);
// Middleware
// Enable CORS for all routes
app.use(cors());
// ! load
app.use(express.json({ limit: '50mb' }));

// Routes
app.use('/api', authRoutes);
app.use('/api', userRoutes);
app.use('/api', memeRoutes);
app.use('/api', messageRoutes);

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

// Store connected users
let users = {};

// Real-time communication with Socket.IO
io.on('connection', (socket) => {
    socket.on('register', (username) => {
        users[username] = socket.id;
        socket.username = username;
    });

    socket.on('sendMessage', async (message) => {
        const { from, to, message: msg } = message;
        const newMessage = new Message({ from, to, message: msg });
        await newMessage.save();
        const recipientSocketId = users[to];
        if (recipientSocketId) {
            io.to(recipientSocketId).emit('receiveMessage', message);
        }
    });

    socket.on('disconnect', () => {
        delete users[socket.username];
    });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
