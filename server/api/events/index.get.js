import { connectDB, ensureModelsRegistered } from '~/server/utils/db'
import { handleError } from '~/server/utils/error'

export default defineEventHandler(async (event) => {
  try {
    // Connect to DB and ensure all models are registered
    await connectDB()
    const { Event } = ensureModelsRegistered()
    
    // Get query parameters
    const query = getQuery(event)
    const { status, roomId, fromDate, toDate, organizerId, search, limit } = query
    
    // Build filter object
    const filter = {}
    
    // Filter by status
    if (status) {
      filter.status = status
    }
    
    // Filter by room
    if (roomId) {
      filter.room = roomId
    }
    
    // Filter by organizer
    if (organizerId) {
      filter.organizer = organizerId
    }
    
    // Filter by date range
    if (fromDate || toDate) {
      filter.eventDate = {}
      if (fromDate) {
        filter.eventDate.$gte = new Date(fromDate)
      }
      if (toDate) {
        filter.eventDate.$lte = new Date(toDate)
      }
    }
    
    // Search in name and description
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ]
    }
    
    // Build query
    let eventsQuery = Event.find(filter)
      .populate('room', 'name location')
      .populate('organizer', 'fullName email')
      .populate('resources.resource', 'name category')
      .sort({ eventDate: 1, startTime: 1 })
    
    // Apply limit if specified
    if (limit) {
      const limitNum = parseInt(limit)
      if (limitNum > 0) {
        eventsQuery = eventsQuery.limit(limitNum)
      }
    }
    
    const events = await eventsQuery
    
    return {
      success: true,
      data: events,
      total: events.length
    }
  } catch (error) {
    return handleError(error)
  }
}) 