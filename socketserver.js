const socketIo = require('socket.io');
const Message = require('./models/Messages');

const initSocketServer = (server) => {
    const io = socketIo(server, {
        cors: {
            origin: '*',
        }
    });

    // Store connected users
    const users = new Map();

    io.on('connection', (socket) => {
        console.log('New client connected');

        socket.on('register', (username) => {
            users.set(username, socket.id);
            console.log(`${username} registered with socket ID ${socket.id}`);
            io.emit('user_status', { username: username, status: 'online' });
        });

        socket.on('private_message', async (data) => {
            // console.log(`Received message data: ${JSON.stringify(data)}`);
            const { sender, recipient, message } = data;
            const newMessage = new Message({ sender, recipient, message, timestamp: new Date() });
            await newMessage.save();

            // console.log(`New message saved: ${JSON.stringify(newMessage)}`);

            if (users.has(recipient)) {
                io.to(users.get(recipient)).emit('new_message', newMessage);
                // console.log(`Message sent to ${recipient}: ${message}`);
            } else {
                // console.log(`Recipient ${recipient} is not online.`);
            }

            io.to(users.get(sender)).emit('new_message', newMessage);
            console.log(`Message sent to ${sender}: ${message}`);

            // Emit user status update
            io.emit('user_status', { username: sender, status: 'online' });
            console.log(`User status emitted for ${sender}: online`);
        });

        socket.on('disconnect', () => {
            users.forEach((value, key) => {
                if (value === socket.id) {
                    users.delete(key);
                    // console.log(`${key} disconnected`);
                    // Emit user status update
                    io.emit('user_status', { username: key, status: 'offline' });
                    // console.log(`User status emitted for ${key}: offline`);
                }
            });
            // console.log('Client disconnected');
        });
    });

    return io;
};

module.exports = initSocketServer;
