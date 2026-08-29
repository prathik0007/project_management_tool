import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import connectDB from './config/db.js';

// Initialize the Express app
const app = express();

// Read the port from .env file, fallback to 5000 if not set
const PORT = process.env.PORT || 5000;

// Enable CORS so the React frontend can communicate with this backend
app.use(cors());

// Middleware to parse incoming JSON data
app.use(express.json());

// Connect to MongoDB before starting the server
connectDB();

// ─── Routes ────────────────────────────────────────────────────────────────

// Phase 1: Simple test route (kept from Phase 1)
app.get('/api/test', (req, res) => {
  res.json({
    message: "Backend is working"
  });
});

// Phase 2: Database connection test route
app.get('/api/db-test', (req, res) => {
  // mongoose.connection.readyState returns a number:
  //  0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
  const state = mongoose.connection.readyState;

  if (state === 1) {
    // 1 means the connection is active and ready
    res.json({ message: "Database is connected" });
  } else {
    // Any other state means the DB is not ready
    res.status(500).json({ message: "Database is NOT connected" });
  }
});

// ─── Start Server ──────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
