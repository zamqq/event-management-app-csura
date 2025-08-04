import { connectDB } from '~/server/utils/db'
import Event from '~/server/models/Event'
import '~/server/models/Resource'
import '~/server/models/Room'
import '~/server/models/User'
import { createCustomError, handleError } from '~/server/utils/error'

export default defineEventHandler(async (event) => {
  try {
    // Connect to DB
    await connectDB()
    
    // Get event ID from params
    const id = event.context.params.id
    
    // Find event by ID
    const eventDoc = await Event.findById(id)
      .populate('room', 'name location capacity image facilities')
      .populate('organizer', 'fullName email')
      .populate('resources.resource', 'name category image description')
    
    // Check if event exists
    if (!eventDoc) {
      throw createCustomError({
        statusCode: 404,
        statusMessage: 'Event not found'
      })
    }
    
    return {
      success: true,
      event: eventDoc
    }
  } catch (error) {
    console.error('Error fetching event:', error)
    return handleError(event, error)
  }
}) 