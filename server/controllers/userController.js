import User from '../models/User.model.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const generateToken = (id, role, gaf, department) => { 
    // הוספנו לטוקן גם את המיקום של המשתמש כדי לחסוך שאילתות
    return jwt.sign({ id, role, gaf, department }, process.env.JWT_SECRET, { 
        expiresIn: '30d', 
    });
};

// @route   POST /api/users/register
const registerUser = async (req, res) => {
    // הוספנו את gaf ו-department לקליטה
    const { email, password, role, gaf, department } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Please include all required fields.' });
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
        return res.status(400).json({ message: 'User already exists.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // יצירת המשתמש עם השדות החדשים
    const user = await User.create({
        email,
        password: hashedPassword,
        role: role || 'User',
        gaf: gaf || '',
        department: department || ''
    });

    if (user) {
        res.status(201).json({
            _id: user.id,
            email: user.email,
            role: user.role,
            gaf: user.gaf,
            department: user.department,
            token: generateToken(user._id, user.role, user.gaf, user.department), 
        });
    } else {
        res.status(400).json({ message: 'Invalid user data.' });
    }
};

// @route   POST /api/users/login
const loginUser = async (req, res) => {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (user && (await bcrypt.compare(password, user.password))) {
        res.json({
            _id: user.id,
            email: user.email,
            role: user.role, 
            gaf: user.gaf,          // מחזירים ללקוח
            department: user.department, // מחזירים ללקוח
            token: generateToken(user._id, user.role, user.gaf, user.department), 
        });
    } else {
        res.status(400).json({ message: 'Invalid credentials.' });
    }
};

// @route   GET /api/users/me
const getMe = async (req, res) => {
    // req.user מגיע מה-middleware ומכיל את כל פרטי המשתמש מהמסד
    const { _id, email, role, gaf, department } = req.user;

    res.status(200).json({
        id: _id,
        email,
        role,
        gaf,
        department
    });
};

export { registerUser, loginUser, getMe };