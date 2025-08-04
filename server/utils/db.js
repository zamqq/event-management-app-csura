
import mongoose from 'mongoose';

// Import all models to ensure they are registered
import Event from '../models/Event.js';
import Resource from '../models/Resource.js';
import Room from '../models/Room.js';
import User from '../models/User.js';

const connectDB = async () => {
  // If already connected, return existing connection
  if (mongoose.connection.readyState >= 1) {
    return mongoose.connection;
  }

  // Check for required environment variable
  const MONGODB_URI = process.env.MONGODB_URI;
  if (!MONGODB_URI) {
    throw new Error('Please define the MONGODB_URI environment variable in your .env file');
  }

  try {
    // Connect with modern options
    await mongoose.connect(MONGODB_URI, {
      serverApi: { 
        version: '1', 
        strict: true, 
        deprecationErrors: true 
      }
    });
    
    console.log("Successfully connected to MongoDB!");
    return mongoose.connection;
  } catch (error) {
    console.error('MongoDB connection failed:', error);
    throw error;
  }
};

// Function to ensure all models are registered (important for serverless environments)
const ensureModelsRegistered = () => {
  // The models are already imported above, so they're registered
  // This function exists to be called before any populate operations
  // to guarantee model registration in serverless environments like Vercel
  return {
    Event,
    Resource,
    Room,
    User
  };
};

export { connectDB, ensureModelsRegistered };
export default connectDB;