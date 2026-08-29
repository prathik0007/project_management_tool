import express from 'express';
import cors from 'cors';

// Initialize the Express app
const app = express();

// Define the Port
const PORT = 5000;

// Enable CORS so the React frontend can communicate with this backend
app.use(cors());

// Middleware to parse incoming JSON data
app.use(express.json());

// Simple Test Route
app.get('/api/test', (req, res) => {
  res.json({
    message: "Backend is working"
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
