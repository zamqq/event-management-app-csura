import { connectDB } from '~/server/utils/db'
import User from '~/server/models/User'
import { requireAuth } from '~/server/utils/auth'
import { createCustomError, handleError } from '~/server/utils/error'

export default defineEventHandler(async (event) => {
  try {
    // Verify authentication token (must be an admin)
    const decoded = requireAuth(event)
    
    // Connect to DB
    await connectDB()
    
    // Check if the requester is admin
    const requester = await User.findById(decoded.id)
    if (!requester || requester.role !== 'admin') {
      throw createCustomError({
        statusCode: 403,
        statusMessage: 'Forbidden - Admin access required'
      })
    }
    
    // Get request body
    const { userId } = await readBody(event)
    
    if (!userId) {
      throw createCustomError({
        statusCode: 400,
        statusMessage: 'User ID is required'
      })
    }
    
    // Find user and update role
    const user = await User.findById(userId)
    
    if (!user) {
      throw createCustomError({
        statusCode: 404,
        statusMessage: 'User not found'
      })
    }
    
    // Set user role to admin
    user.role = 'admin'
    await user.save()
    

    
    return {
      success: true,
      message: 'User has been successfully made an admin',
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role
      }
    }
  } catch (error) {
    console.error('Make admin error:', error)
    return handleError(event, error)
  }
}) 