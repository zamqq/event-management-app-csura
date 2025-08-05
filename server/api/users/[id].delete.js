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
    
    // Get current user to check if admin
    const currentUser = await User.findById(decoded.id)
    
    if (!currentUser || currentUser.role !== 'admin') {
      throw createCustomError({
        statusCode: 403,
        statusMessage: 'Access denied. Admin privileges required.'
      })
    }
    
    // Get user ID from route params
    const userId = getRouterParam(event, 'id')
    
    if (!userId) {
      throw createCustomError({
        statusCode: 400,
        statusMessage: 'User ID is required'
      })
    }

    // Prevent admin from deleting themselves
    if (userId === currentUser._id.toString()) {
      throw createCustomError({
        statusCode: 400,
        statusMessage: 'You cannot delete your own account'
      })
    }

    // Find and delete the user
    const userToDelete = await User.findById(userId)
    if (!userToDelete) {
      throw createCustomError({
        statusCode: 404,
        statusMessage: 'User not found'
      })
    }

    await User.findByIdAndDelete(userId)

    return {
      success: true,
      message: 'User deleted successfully'
    }

  } catch (error) {
    return handleError(error)
  }
})