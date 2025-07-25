import mongoose from 'mongoose'

// Global cached connection
let cached = global.mongoose

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null }
}

export const connectDB = async () => {
  if (cached.conn) {
    return cached.conn
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 10000,  // More time to select a server
      connectTimeoutMS: 15000,          // More time for initial connection
      socketTimeoutMS: 45000,           // More time for operations to complete
    }

    // Use environment variable
    const MONGODB_URI = process.env.MONGODB_URI

    if (!MONGODB_URI) {
      throw new Error('Please define the MONGODB_URI environment variable in your .env file')
    }

    try {
      cached.promise = mongoose.connect(MONGODB_URI, opts)
    } catch (error) {
      console.error('Failed to initialize MongoDB connection:', error)
      cached.promise = null
      throw error
    }
  }

  try {
    cached.conn = await cached.promise
    return cached.conn
  } catch (error) {
    cached.promise = null
    console.error('MongoDB connection failed:', error)
    throw error
  }
}

export default connectDB 