import { connectDB } from '~/server/utils/db'
import Event from '~/server/models/Event'
import Resource from '~/server/models/Resource'
import Room from '~/server/models/Room'
import User from '~/server/models/User'
import { handleError } from '~/server/utils/error'

export default defineEventHandler(async (event) => {
  try {
    // Connect to DB
    await connectDB()
    
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
    
    // Search functionality for event name and description
    if (search) {
      const searchRegex = new RegExp(search, 'i') // Case-insensitive search
      filter.$or = [
        { name: searchRegex },
        { description: searchRegex }
      ]
    }
    
    // Build query with optional limit
    let eventsQuery = Event.find(filter)
      .populate('room', 'name location capacity image')
      .populate('organizer', 'fullName email')
      .populate('resources.resource', 'name category image description')
      .sort({ eventDate: 1, startTime: 1 })
    
    // Apply limit if provided
    if (limit) {
      const limitNum = parseInt(limit)
      if (!isNaN(limitNum) && limitNum > 0) {
        eventsQuery = eventsQuery.limit(limitNum)
      }
    }
    
    const events = await eventsQuery
    
    return {
      success: true,
      events
    }
  } catch (error) {
    console.error('Error fetching events:', error)
    return handleError(event, error)
  }
}) 