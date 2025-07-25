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
    
    // Get request body
    const roomData = await readBody(event)
    
    // Check if room exists
    const room = await Room.findById(id)
    if (!room) {
      throw createCustomError({
        statusCode: 404,
        statusMessage: 'Room not found'
      })
    }
    
    // If name is being updated, check for duplicate
    if (roomData.name && roomData.name !== room.name) {
      const existingRoom = await Room.findOne({ name: roomData.name })
      if (existingRoom) {
        throw createCustomError({
          statusCode: 409,
          statusMessage: 'A room with this name already exists'
        })
      }
    }
    
    // Update room
    const updatedRoom = await Room.findByIdAndUpdate(
      id,
      roomData,
      { new: true, runValidators: true }
    )
    
    return {
      success: true,
      room: updatedRoom
    }
  } catch (error) {
    console.error(`Error updating room ${event.context.params.id}:`, error)
    return handleError(event, error)
  }
}) 