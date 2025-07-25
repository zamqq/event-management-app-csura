import { connectDB } from '~/server/utils/db'
import Room from '~/server/models/Room'
import { createCustomError, handleError } from '~/server/utils/error'

export default defineEventHandler(async (event) => {
  try {
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
    
    // Find room by ID
    const room = await Room.findById(id)
    
    // Check if room exists
    if (!room) {
      throw createCustomError({
        statusCode: 404,
        statusMessage: 'Room not found'
      })
    }
    
    return {
      success: true,
      room
    }
  } catch (error) {
    console.error(`Error fetching room ${event.context.params.id}:`, error)
    return handleError(event, error)
  }
}) 