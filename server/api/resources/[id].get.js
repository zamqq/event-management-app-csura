import { connectDB } from '~/server/utils/db'
import Resource from '~/server/models/Resource'
import { createCustomError, handleError } from '~/server/utils/error'

export default defineEventHandler(async (event) => {
  try {
    // Connect to DB
    await connectDB()
    
    // Get resource ID from params
    const id = event.context.params.id
    
    // Find resource by ID
    const resource = await Resource.findById(id)
    
    // Check if resource exists
    if (!resource) {
      throw createCustomError({
        statusCode: 404,
        statusMessage: 'Resource not found'
      })
    }
    
    return {
      success: true,
      resource
    }
  } catch (error) {
    console.error('Error fetching resource:', error)
    return handleError(event, error)
  }
}) 