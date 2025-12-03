import jwt from 'jsonwebtoken';
import User from '../models/User.model.js';

// Protects routes that require a valid JWT token
const protect = async (req, res, next) => {
    let token;

    // 1. Check if the Authorization header exists and starts with 'Bearer'
    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        try {
            // 2. Extract the token from the header
            token = req.headers.authorization.split(' ')[1];

            // 3. Verify the token using the secret key
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // 4. Find the user ID from the decoded token payload
            // .select('-password') excludes the password hash from the user object
            req.user = await User.findById(decoded.id).select('-password');

            // 5. Move to the next middleware/controller function
            next();
        } catch (error) {
            console.error(error);
            return res.status(401).json({ message: 'Not authorized, token failed.' });
        }
    }

    if (!token) {
        return res.status(401).json({ message: 'Not authorized, no token.' });
    }
};

// Middleware to restrict access based on user role (Authorization)
const restrictTo = (...roles) => {
    return (req, res, next) => {
        // req.user is set by the 'protect' middleware!
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ 
                message: 'Forbidden: You do not have permission to perform this action.' 
            });
        }
        next();
    };
};

export { protect, restrictTo };