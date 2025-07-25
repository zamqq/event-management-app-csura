import { connectDB } from '~/server/utils/db'
import User from '~/server/models/User'
import { generateToken, setAuthCookie } from '~/server/utils/auth'
import { createCustomError, handleError } from '~/server/utils/error'

export default defineEventHandler(async (event) => {
  try {
    // Connect to DB
    await connectDB()
    
    // Get request body
    const { email, password, rememberMe } = await readBody(event)
    
    // Validate required fields
    if (!email || !password) {
      throw createCustomError({
        statusCode: 400, 
        statusMessage: 'Please provide email and password'
      })
    }
    
    // Find user by email and explicitly select the password field
    const user = await User.findOne({ email }).select('+password')
    
    // Check if user exists
    if (!user) {
      throw createCustomError({
        statusCode: 401,
        statusMessage: 'Invalid credentials'
      })
    }
    
    // Check if password matches
    const isPasswordMatch = await user.comparePassword(password)
    if (!isPasswordMatch) {
      throw createCustomError({
        statusCode: 401,
        statusMessage: 'Invalid credentials'
      })
    }
    
    // Generate JWT token
    const token = generateToken(user)
    
    // Set auth cookie (with longer expiry if rememberMe is true)
    setAuthCookie(event, token, rememberMe)
    
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
  } catch (error) {
    console.error('Login error:', error)
    return handleError(event, error)
  }
}) 