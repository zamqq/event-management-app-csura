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
    
    // Get request body
    const body = await readBody(event)
    const { fullName, email, role } = body
    
    // Validate required fields
    if (!fullName || !email || !role) {
      throw createCustomError({
        statusCode: 400,
        statusMessage: 'Full name, email, and role are required'
      })
    }
    
    // Validate role
    if (!['user', 'admin'].includes(role)) {
      throw createCustomError({
        statusCode: 400,
        statusMessage: 'Invalid role. Must be either "user" or "admin"'
      })
    }
    
    // Check if email is already taken by another user
    const existingUser = await User.findOne({ 
      email: email.toLowerCase(),
      _id: { $ne: userId }
    })
    
    if (existingUser) {
      throw createCustomError({
        statusCode: 400,
        statusMessage: 'Email is already taken by another user'
      })
    }
    
    // Update user
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        fullName: fullName.trim(),
        email: email.toLowerCase().trim(),
        role
      },
      { 
        new: true,
        runValidators: true
      }
    ).select('-password')
    
    if (!updatedUser) {
      throw createCustomError({
        statusCode: 404,
        statusMessage: 'User not found'
      })
    }
    
    return {
      success: true,
      message: 'User updated successfully',
      user: updatedUser
    }
    
  } catch (error) {
    console.error('Update user error:', error)
    return handleError(event, error)
  }
}) 