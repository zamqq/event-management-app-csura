import { connectDB } from '~/server/utils/db'
import User from '~/server/models/User'
import { generateToken, setAuthCookie } from '~/server/utils/auth'
import { createCustomError, handleError } from '~/server/utils/error'

export default defineEventHandler(async (event) => {
  try {
    // Connect to DB
    try {
      await connectDB()
    } catch (dbError) {
      console.error('MongoDB connection failed:', dbError)
      throw createCustomError({
        statusCode: 500,
        statusMessage: 'Database connection failed'
      })
    }
    
    // Get request body
    const { fullName, email, password, confirmPassword } = await readBody(event)
    
    // Validate required fields
    if (!fullName || !email || !password) {
      throw createCustomError({
        statusCode: 400,
        statusMessage: 'Please provide all required fields'
      })
    }
    
    // Validate password match
    if (password !== confirmPassword) {
      throw createCustomError({
        statusCode: 400,
        statusMessage: 'Passwords do not match'
      })
    }
    
    // Check if user already exists
    try {
      const existingUser = await User.findOne({ email })
      
      if (existingUser) {
        throw createCustomError({
          statusCode: 409,
          statusMessage: 'Email already in use'
        })
      }
    } catch (dbError) {
      console.error('Error checking existing user:', dbError)
      throw createCustomError({
        statusCode: 500,
        statusMessage: 'Error checking existing user'
      })
    }
    
    // Create new user
    try {
      const user = await User.create({
        fullName,
        email,
        password
      })
      
      // Generate JWT token
      const token = generateToken(user)
      
      // Set auth cookie
      setAuthCookie(event, token)
      
      // Return success response with user data (excluding password)
      return {
        success: true,
        user: {
          id: user._id,
          fullName: user.fullName,
          email: user.email,
          role: user.role
        },
        token
      }
    } catch (createError) {
      console.error('Error creating user:', createError)
      throw createCustomError({
        statusCode: 500,
        statusMessage: 'Error creating user: ' + createError.message
      })
    }
  } catch (error) {
    console.error('Registration error:', error)
    return handleError(event, error)
  }
}) 