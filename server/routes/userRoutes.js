import express from 'express';
// 1. Import all necessary controller functions
import { registerUser, loginUser, getMe } from '../controllers/userController.js'; 
// 2. Import the middleware protection function
import { protect } from '../middleware/authMiddleware.js'; 

const router = express.Router();

// @route   POST /api/users/register
// @access  Public
router.post('/register', registerUser);

// @route   POST /api/users/login
// @access  Public
// 3. Added the login route
router.post('/login', loginUser);

// @route   GET /api/users/me
// @access  Private (Needs JWT authentication)
// 4. Added the protected route: 'protect' runs first, then 'getMe'
router.get('/me', protect, getMe); 

export default router;