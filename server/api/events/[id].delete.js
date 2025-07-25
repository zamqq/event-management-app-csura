import { connectDB } from '~/server/utils/db'
import Event from '~/server/models/Event'
import { requireAuth } from '~/server/utils/auth'
import { createCustomError, handleError } from '~/server/utils/error'

export default defineEventHandler(async (event) => {
  try {
    // Verify authentication
    const user = requireAuth(event)
    
    // Connect to DB
    await connectDB()
    
    // Get event ID from params
    const id = event.context.params.id
    
    // Find event by ID
    const existingEvent = await Event.findById(id)
    
    // Check if event exists
    if (!existingEvent) {
      throw createCustomError({
        statusCode: 404,
        statusMessage: 'Event not found'
      })
    }
    
    // Check if user is authorized to delete this event
    // Either the organizer or an admin can delete
    if (existingEvent.organizer.toString() !== user._id && user.role !== 'admin') {
      throw createCustomError({
        statusCode: 403,
        statusMessage: 'You are not authorized to delete this event'
      })
    }
    
    // Delete the event
    await Event.findByIdAndDelete(id)
    
    return {
      success: true,
      message: 'Event deleted successfully'
    }
  } catch (error) {
    console.error('Error deleting event:', error)
    return handleError(event, error)
  }
}) 