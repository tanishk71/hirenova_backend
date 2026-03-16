const jwt = require('jsonwebtoken');
const User = require('../models/user');

const protect = async (req, res, next) => {
    let token;

    // 1. Check if token exists in headers and starts with 'Bearer'
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // 2. Extract the token from the "Bearer <token>" string
            token = req.headers.authorization.split(' ')[1];

            // 3. Verify the token using your JWT_SECRET
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // 4. Find the user in the database and attach it to the request (excluding password)
            req.user = await User.findById(decoded.id).select('-password');

            // 5. Success! Move to the next function
            next();
        } catch (error) {
            console.error(error);
            res.status(401).json({ message: 'Not authorized, token failed' });
        }
    }

    if (!token) {
        res.status(401).json({ message: 'Not authorized, no token found' });
    }
};

module.exports = { protect };