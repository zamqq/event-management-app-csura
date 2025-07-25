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
    
    // Get request body
    const { currentPassword, newPassword, confirmPassword } = await readBody(event)
    
    // Validate required fields
    if (!currentPassword || !newPassword || !confirmPassword) {
      throw createCustomError({
        statusCode: 400,
        statusMessage: 'Please provide all required fields'
      })
    }
    
    // Validate new password
    if (newPassword.length < 6) {
      throw createCustomError({
        statusCode: 400,
        statusMessage: 'New password must be at least 6 characters long'
      })
    }
    
    // Validate password confirmation
    if (newPassword !== confirmPassword) {
      throw createCustomError({
        statusCode: 400,
        statusMessage: 'New passwords do not match'
      })
    }
    
    // Find user and include password field
    const user = await User.findById(decoded.id).select('+password')
    
    if (!user) {
      throw createCustomError({
        statusCode: 404,
        statusMessage: 'User not found'
      })
    }
    
    // Verify current password
    const isCurrentPasswordValid = await user.comparePassword(currentPassword)
    if (!isCurrentPasswordValid) {
      throw createCustomError({
        statusCode: 401,
        statusMessage: 'Current password is incorrect'
      })
    }
    
    // Check if new password is different from current
    const isSamePassword = await user.comparePassword(newPassword)
    if (isSamePassword) {
      throw createCustomError({
        statusCode: 400,
        statusMessage: 'New password must be different from current password'
      })
    }
    
    // Update password (will be hashed by the pre-save middleware)
    user.password = newPassword
    await user.save()
    
    return {
      success: true,
      message: 'Password changed successfully'
    }
    
  } catch (error) {
    console.error('Change password error:', error)
    return handleError(event, error)
  }
}) 