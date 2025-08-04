
import mongoose from 'mongoose';

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

export { connectDB };
export default connectDB;