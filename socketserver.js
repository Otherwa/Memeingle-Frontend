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
        console.log(users);

        socket.on('register', (username) => {
            users.set(username, socket.id);
            console.log(`${username} registered with socket ID ${socket.id}`);
            io.emit('user_status', { username: username, status: 'online' });
        });

        socket.on('private_message', async (data) => {
            const { sender, recipient, message } = data;
            const newMessage = new Message({ sender, recipient, message, timestamp: new Date() });
            await newMessage.save();

            if (users.has(recipient)) {
                io.to(users.get(recipient)).emit('new_message', newMessage);
                console.log(`Message sent to ${recipient}: ${message}`);
            } else {
                console.log(`Recipient ${recipient} is not online.`);
            }

            io.to(users.get(sender)).emit('new_message', newMessage);
            console.log(`Message sent to ${sender}: ${message}`);

            io.emit('user_status', { username: sender, status: 'online' });
            console.log(`User status emitted for ${sender}: online`);
        });

        socket.on('deregister', (username) => {
            if (users.has(username)) {
                users.delete(username);
                console.log(`${username} deregistered`);
                io.emit('user_status', { username: username, status: 'offline' });
            }
        });

        socket.on('disconnect', () => {
            let disconnectedUser = null;
            users.forEach((value, key) => {
                if (value === socket.id) {
                    disconnectedUser = key;
                    users.delete(key);
                    console.log(`${key} disconnected`);
                    io.emit('user_status', { username: key, status: 'offline' });
                }
            });

            if (disconnectedUser) {
                console.log(`User status emitted for ${disconnectedUser}: offline`);
            } else {
                console.log('Client disconnected');
            }
        });
    });

    return io;
};

module.exports = initSocketServer;
