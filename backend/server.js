import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import mongoose from 'mongoose';
import connectDB from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import projectRoutes from './routes/projectRoutes.js';
import taskRoutes from './routes/taskRoutes.js';
import responseFormat from './middleware/responseFormat.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';
import { securityHeaders } from './middleware/security.js';

// Initialize the Express app
const app = express();

// Read the port from .env file, fallback to 5000 if not set
const PORT = process.env.PORT || 5000;

// ─── Middleware ─────────────────────────────────────────────────────────────

// Enable CORS — allows the React frontend (localhost:5173, localhost:5174, etc.) to send requests
// credentials: true is required so cookies are included in cross-origin requests
const explicitOrigins = [
  process.env.FRONTEND_URL,
  process.env.CLIENT_URL,
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174',
  'http://127.0.0.1:5175',
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, server-to-server)
    if (!origin) return callback(null, true);
    if (
      explicitOrigins.includes(origin) ||
      /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)
    ) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true, // Allow cookies to be sent and received
}));

app.use(securityHeaders);
app.use(responseFormat);

// Parse incoming JSON request bodies (e.g., { "email": "...", "password": "..." })
app.use(express.json({ limit: '100kb' }));

// Parse cookies from incoming requests — required for reading JWT from cookie
app.use(cookieParser());

// ─── Database ───────────────────────────────────────────────────────────────

// Connect to MongoDB when the server starts
connectDB();

// ─── Routes ─────────────────────────────────────────────────────────────────

// Phase 1: Simple test route
app.get('/api/test', (req, res) => {
  res.json({ message: 'Backend is working' });
});

// Deployment-safe endpoint for platform health checks.
app.get('/api/health', (req, res) => {
  res.status(200).json({ success: true, message: 'Server is running' });
});

// Phase 2: Database connection test route
app.get('/api/db-test', (req, res) => {
  const state = mongoose.connection.readyState;
  if (state === 1) {
    res.json({ message: 'Database is connected' });
  } else {
    res.status(500).json({ message: 'Database is NOT connected' });
  }
});

// Phase 3A: Authentication routes (/api/auth/register, /api/auth/login, etc.)
app.use('/api/auth', authRoutes);
// Phase 5B: Users list endpoint for task assignment (/api/users)
app.use('/api', authRoutes);

// Phase 4A: Project routes
// All routes defined in projectRoutes.js will be prefixed with /api/projects
app.use('/api/projects', projectRoutes);

// Phase 5A: Task routes
// General task routes: /api/tasks
app.use('/api/tasks', taskRoutes);
// Nested route: /api/projects/:projectId/tasks
// mergeParams: true is set on the project router so :projectId is accessible
app.use('/api/projects/:projectId/tasks', taskRoutes);

app.use(notFound);
app.use(errorHandler);

// ─── Start Server ───────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
