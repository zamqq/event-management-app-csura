import { connectDB } from '~/server/utils/db'
import User from '~/server/models/User'
import { requireAuth } from '~/server/utils/auth'
import { createCustomError, handleError } from '~/server/utils/error'

export default defineEventHandler(async (event) => {
  try {
    // Verify authentication token
    const decoded = requireAuth(event)
    
    // Connect to DB
    await connectDB()
    

    
    // Get user data (omitting the password)
    const user = await User.findById(decoded.id)
    
    if (!user) {
      throw createCustomError({
        statusCode: 404,
        statusMessage: 'User not found'
      })
    }
    
    return {
      success: true,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt
      }
    }
  } catch (error) {
    console.error('Fetch user error:', error)
    return handleError(event, error)
  }
}) 