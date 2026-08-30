import jwt from 'jsonwebtoken';
import User from '../model/User.js';

// ─── Helper: Generate JWT and set it as an HTTP-only cookie ────────────────
const sendTokenCookie = (res, userId) => {
  // Create a JWT token that encodes the user's ID
  // It expires based on JWT_EXPIRE in the .env file (e.g., "7d" = 7 days)
  const token = jwt.sign(
    { id: userId },            // Payload: what we embed inside the token
    process.env.JWT_SECRET,    // Secret key: used to sign and verify the token
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );

  // Cookie options
  const cookieOptions = {
    httpOnly: true,            // Cannot be accessed by JavaScript (prevents XSS attacks)
    secure: process.env.NODE_ENV === 'production', // HTTPS only in production
    sameSite: 'lax',           // Protects against CSRF attacks
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
  };

  // Attach the token to the response as a cookie named "token"
  res.cookie('token', token, cookieOptions);
};

// ─── REGISTER ───────────────────────────────────────────────────────────────
// POST /api/auth/register
export const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // 1. Validate that all fields are provided
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Please provide name, email, and password' });
    }

    // 2. Check if a user with this email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'A user with this email already exists' });
    }

    // 3. Create the new user in MongoDB
    // The password will be automatically hashed by the pre-save hook in User.js
    const user = await User.create({ name, email, password });

    // 4. Generate JWT and set it as a cookie
    sendTokenCookie(res, user._id);

    // 5. Return the new user's info (never return the password)
    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    // Handle Mongoose validation errors (e.g., invalid email format)
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({ message: messages.join(', ') });
    }
    console.error('Register error:', error.message);
    res.status(500).json({ message: 'Server error during registration' });
  }
};

// ─── LOGIN ──────────────────────────────────────────────────────────────────
// POST /api/auth/login
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Validate that both email and password are provided
    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }

    // 2. Find the user by email
    // We use .select('+password') because password has select:false in the schema
    const user = await User.findOne({ email }).select('+password');

    // 3. If no user found, return a generic error (don't reveal if email exists)
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // 4. Compare the entered password against the stored hashed password
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // 5. Generate JWT and set it as a cookie
    sendTokenCookie(res, user._id);

    // 6. Return user info (never return the password)
    res.status(200).json({
      success: true,
      message: 'Logged in successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error('Login error:', error.message);
    res.status(500).json({ message: 'Server error during login' });
  }
};

// ─── GET CURRENT USER (Protected) ──────────────────────────────────────────
// GET /api/auth/me
export const getMe = async (req, res) => {
  try {
    // req.user is attached by the auth middleware after verifying the JWT
    // User password is excluded because select:false is set on the schema
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error('Get me error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// ─── GET ALL USERS (for task assignment dropdown) ───────────────────────────
// GET /api/users
// Protected — requires auth. Returns safe fields only (no passwords).
export const getUsers = async (req, res) => {
  try {
    // Select only the fields safe to expose: id, name, email
    const users = await User.find({}).select('name email').sort({ name: 1 });
    res.status(200).json({ success: true, users });
  } catch (error) {
    console.error('Get users error:', error.message);
    res.status(500).json({ message: 'Server error while fetching users' });
  }
};

// ─── LOGOUT ─────────────────────────────────────────────────────────────────
// POST /api/auth/logout
export const logoutUser = (req, res) => {
  // Clear the "token" cookie by setting it to empty with maxAge: 0
  res.cookie('token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    expires: new Date(0), // Set expiry to the past — browser will delete it immediately
  });

  res.status(200).json({ success: true, message: 'Logged out successfully' });
};
