import { connectDB, ensureModelsRegistered } from '~/server/utils/db'
import { createCustomError, handleError } from '~/server/utils/error'

export default defineEventHandler(async (event) => {
  try {
    // Connect to DB and ensure all models are registered
    await connectDB()
    const { Event } = ensureModelsRegistered()
    
    const eventId = getRouterParam(event, 'id')
    
    if (!eventId) {
      throw createCustomError('Event ID is required', 400)
    }
    
    const foundEvent = await Event.findById(eventId)
      .populate('room', 'name location capacity facilities image')
      .populate('organizer', 'fullName email')
      .populate('resources.resource', 'name category description image')
    
    if (!foundEvent) {
      throw createCustomError('Event not found', 404)
    }
    
    return {
      success: true,
      data: foundEvent
    }
  } catch (error) {
    return handleError(error)
  }
}) 