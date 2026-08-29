import jwt from 'jsonwebtoken';
import User from '../model/User.js';

// ─── Authentication Middleware ───────────────────────────────────────────────
// This function runs BEFORE a protected route handler
// It checks if the request carries a valid JWT in the cookie
const protect = async (req, res, next) => {
  try {
    // 1. Read the "token" cookie from the incoming request
    const token = req.cookies?.token;

    // 2. If no token found, the user is not logged in
    if (!token) {
      return res.status(401).json({ message: 'Not authorized, no token found' });
    }

    // 3. Verify the token using the same secret used to sign it
    // If the token is invalid or expired, jwt.verify() will throw an error
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 4. decoded.id is the user ID we embedded when creating the token
    // Fetch the user from the database (exclude the password)
    req.user = await User.findById(decoded.id).select('-password');

    if (!req.user) {
      return res.status(401).json({ message: 'Not authorized, user no longer exists' });
    }

    // 5. Everything is valid — pass control to the next handler (the actual route)
    next();
  } catch (error) {
    // Handle specific JWT errors with clear messages
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Not authorized, invalid token' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Not authorized, token has expired' });
    }
    console.error('Auth middleware error:', error.message);
    res.status(500).json({ message: 'Server error in authentication' });
  }
};

export default protect;
