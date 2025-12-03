import User from '../models/User.model.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// Function to generate the JWT token
const generateToken = (id, role) => { 
    // עכשיו הטוקן מכיל את ה-id ואת ה-role, מה שמאפשר ל-Frontend ול-Middleware לדעת מי המשתמש
    return jwt.sign({ id, role }, process.env.JWT_SECRET, { 
        expiresIn: '30d', 
    });
};

// @desc    Register a new user
// @route   POST /api/users/register
// @access  Public
const registerUser = async (req, res) => {
    const { email, password, role } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Please include all required fields (Email, Password).' });
    }

    const userExists = await User.findOne({ email });

    if (userExists) {
        return res.status(400).json({ message: 'User already exists.' });
    }

    // Hashing the Password (CRITICAL SECURITY STEP)
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
        email,
        password: hashedPassword,
        role: role || 'User' 
    });

    if (user) {
        res.status(201).json({
            _id: user.id,
            email: user.email,
            role: user.role,
            // תיקון 1: העברת user.role לפונקציית generateToken
            token: generateToken(user._id, user.role), 
        });
    } else {
        res.status(400).json({ message: 'Invalid user data.' });
    }
};

// @desc    Authenticate a user
// @route   POST /api/users/login
// @access  Public
const loginUser = async (req, res) => {
    const { email, password } = req.body;

    // 1. Check for user email in DB
    const user = await User.findOne({ email });

    // 2. Compare the sent password with the hashed password in the DB
    if (user && (await bcrypt.compare(password, user.password))) {
        // Passwords match - send success response with token
        res.json({
            _id: user.id,
            email: user.email,
            role: user.role, 
            // תיקון 2: העברת user.role לפונקציית generateToken
            token: generateToken(user._id, user.role), 
        });
    } else {
        // Authentication failed
        res.status(400).json({ message: 'Invalid credentials.' });
    }
    // הערה: הסוגר החסר היה כאן.
};

// @desc    Get current user data
// @route   GET /api/users/me
// @access  Private (Requires a token)
const getMe = async (req, res) => {
    // req.user is available because of the 'protect' middleware!
    const { _id, email, role } = req.user;

    res.status(200).json({
        id: _id,
        email,
        role,
    });
};

export {
    registerUser,
    loginUser,
    getMe
};