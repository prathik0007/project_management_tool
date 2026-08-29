import express from 'express';
import {
  registerUser,
  loginUser,
  getMe,
  logoutUser,
} from '../controllers/authController.js';
import protect from '../middleware/auth.js';

const router = express.Router();

// POST /api/auth/register — Create a new user account
router.post('/register', registerUser);

// POST /api/auth/login — Login with email and password
router.post('/login', loginUser);

// GET /api/auth/me — Get the currently logged-in user (protected)
// "protect" middleware runs first — if it passes, getMe runs
router.get('/me', protect, getMe);

// POST /api/auth/logout — Clear the auth cookie and log out
router.post('/logout', logoutUser);

export default router;
