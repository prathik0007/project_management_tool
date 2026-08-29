import express from 'express';
import {
  registerUser,
  loginUser,
  getMe,
  logoutUser,
  getUsers,
} from '../controllers/authController.js';
import protect from '../middleware/auth.js';
import { authRateLimit } from '../middleware/security.js';

const router = express.Router();

// POST /api/auth/register — Create a new user account
router.post('/register', authRateLimit, registerUser);

// POST /api/auth/login — Login with email and password
router.post('/login', authRateLimit, loginUser);

// GET /api/auth/me — Get the currently logged-in user (protected)
// "protect" middleware runs first — if it passes, getMe runs
router.get('/me', protect, getMe);

// POST /api/auth/logout — Clear the auth cookie and log out
router.post('/logout', logoutUser);

// GET /api/users — Get all users for task assignment (protected)
router.get('/users', protect, getUsers);

export default router;
