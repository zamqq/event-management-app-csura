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
    
    // Get request body
    const roomData = await readBody(event)
    
    // Validate required fields
    const { name, capacity, location } = roomData
    if (!name || !capacity || !location) {
      throw createCustomError({
        statusCode: 400,
        statusMessage: 'Name, capacity, and location are required'
      })
    }
    
    // Check if room with same name already exists
    const existingRoom = await Room.findOne({ name })
    if (existingRoom) {
      throw createCustomError({
        statusCode: 409,
        statusMessage: 'A room with this name already exists'
      })
    }
    
    // Create new room
    const room = await Room.create(roomData)
    
    return {
      success: true,
      room
    }
  } catch (error) {
    console.error('Error creating room:', error)
    return handleError(event, error)
  }
}) 