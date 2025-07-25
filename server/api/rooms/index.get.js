import { connectDB } from '~/server/utils/db'
import Room from '~/server/models/Room'
import { handleError } from '~/server/utils/error'

export default defineEventHandler(async (event) => {
  try {
    // Connect to DB
    await connectDB()
    
    // Get query parameters
    const query = getQuery(event)
    const { isAvailable, facilities, minCapacity, search } = query
    
    // Build filter object
    const filter = {}
    
    // Filter by availability
    if (isAvailable !== undefined) {
      filter.isAvailable = isAvailable === 'true'
    }
    
    // Filter by minimum capacity
    if (minCapacity) {
      filter.capacity = { $gte: parseInt(minCapacity) }
    }
    
    // Filter by facilities
    if (facilities) {
      // Handle single facility or array of facilities
      const facilitiesArray = Array.isArray(facilities) ? facilities : [facilities]
      filter.facilities = { $all: facilitiesArray }
    }
    
    // Search by name or location
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ]
    }
    
    // Fetch rooms with filters
    const rooms = await Room.find(filter).sort({ name: 1 })
    
    return {
      success: true,
      rooms
    }
  } catch (error) {
    console.error('Error fetching rooms:', error)
    return handleError(event, error)
  }
}) 