// middleware/auth.js

const jwt = require('jsonwebtoken');

module.exports = function (req, res, next) {
    // Get token from header
    const token = req.header('Authorization').replace('Bearer ', '');

    // Check if no token
    if (!token) {
        return res.status(401).json({ message: 'Authorization denied' });
    }

    try {
        // Verify token
        const decoded = jwt.verify(token, 'Tatakae'); // Change secret
        req.user = decoded.user;
        next();
    } catch (err) {
        console.error('Token verification failed:', err);
        res.status(401).json({ message: 'Token is not valid' });
    }
};
