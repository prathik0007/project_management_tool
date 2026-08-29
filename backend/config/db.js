import mongoose from 'mongoose';

// connectDB is an async function that connects Mongoose to MongoDB
const connectDB = async () => {
  try {
    // mongoose.connect() opens a connection to the MongoDB database
    // process.env.MONGO_URI reads the connection string from the .env file
    const conn = await mongoose.connect(process.env.MONGO_URI);

    // If connection succeeds, log the host name of the connected MongoDB server
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    // If connection fails, log the error message to the terminal
    // Do not print connection details; they can contain sensitive host data.
    console.error('MongoDB connection failed');

    // Exit the Node.js process with code 1 (means failure)
    // This prevents the server from running without a database
    process.exit(1);
  }
};

// Export the function so it can be imported and called in server.js
export default connectDB;
