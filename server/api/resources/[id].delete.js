import { connectDB } from '~/server/utils/db'
import Resource from '~/server/models/Resource'
import Event from '~/server/models/Event'
import { requireAuth } from '~/server/utils/auth'
import { createCustomError, handleError } from '~/server/utils/error'

export default defineEventHandler(async (event) => {
  try {
    // Verify authentication - only admins can delete resources
    const user = requireAuth(event, { requireAdmin: true })
    
    // Connect to DB
    await connectDB()
    
    // Get resource ID from params
    const id = event.context.params.id
    
    // Check if resource is being used in any events
    const eventsUsingResource = await Event.countDocuments({
      'resources.resource': id
    })
    
    if (eventsUsingResource > 0) {
      throw createCustomError({
        statusCode: 400,
        statusMessage: `Cannot delete resource as it is being used in ${eventsUsingResource} event(s)`
      })
    }
    
    // Delete resource
    const deletedResource = await Resource.findByIdAndDelete(id)
    
    // Check if resource was found and deleted
    if (!deletedResource) {
      throw createCustomError({
        statusCode: 404,
        statusMessage: 'Resource not found'
      })
    }
    
    return {
      success: true,
      message: 'Resource deleted successfully'
    }
  } catch (error) {
    console.error('Error deleting resource:', error)
    return handleError(event, error)
  }
}) 