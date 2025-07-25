import { connectDB } from '~/server/utils/db'
import Room from '~/server/models/Room'
import { requireAuth } from '~/server/utils/auth'
import { createCustomError, handleError } from '~/server/utils/error'

export default defineEventHandler(async (event) => {
  try {
    // Verify authentication and admin role
    const user = requireAuth(event)
    if (user.role !== 'admin') {
      throw createCustomError({
        statusCode: 403,
        statusMessage: 'Forbidden - Admin access required'
      })
    }
    
    // Connect to DB
    await connectDB()
    
    // Get room ID from route params
    const id = event.context.params.id
    
    // Validate ID format
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      throw createCustomError({
        statusCode: 400,
        statusMessage: 'Invalid room ID format'
      })
    }
    
    // Find room by ID and delete
    const room = await Room.findByIdAndDelete(id)
    
    // Check if room exists
    if (!room) {
      throw createCustomError({
        statusCode: 404,
        statusMessage: 'Room not found'
      })
    }
    
    return {
      success: true,
      message: 'Room deleted successfully'
    }
  } catch (error) {
    console.error(`Error deleting room ${event.context.params.id}:`, error)
    return handleError(event, error)
  }
}) 