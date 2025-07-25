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
    
    // Get query parameters
    const query = getQuery(event)
    const { search, role } = query
    const filter = {}
    
    // Search functionality for user name and email
    if (search) {
      const searchRegex = new RegExp(search, 'i') // Case-insensitive search
      filter.$or = [
        { fullName: searchRegex },
        { email: searchRegex }
      ]
    }
    
    // Filter by role
    if (role) {
      filter.role = role
    }
    
    // Get users with filters (excluding passwords)
    const users = await User.find(filter).select('-password').sort({ createdAt: -1 })
    
    return {
      success: true,
      users
    }
    
  } catch (error) {
    console.error('Get users error:', error)
    return handleError(event, error)
  }
}) 