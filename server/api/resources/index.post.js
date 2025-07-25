import { connectDB } from '~/server/utils/db'
import Resource from '~/server/models/Resource'
import { requireAuth } from '~/server/utils/auth'
import { handleError } from '~/server/utils/error'
import { createCustomError } from '~/server/utils/error'

export default defineEventHandler(async (event) => {
  try {
    // Verify authentication and require admin privileges
    const user = requireAuth(event)
    
    // Check if user is admin
    if (user.role !== 'admin') {
      throw createCustomError({
        statusCode: 403,
        statusMessage: 'Admin privileges required to create resources'
      })
    }
    
    // Connect to DB
    await connectDB()
    
    // Get request body
    const resourceData = await readBody(event)
    
    // Ensure availableQuantity is set to totalQuantity initially
    if (resourceData.totalQuantity !== undefined && resourceData.availableQuantity === undefined) {
      resourceData.availableQuantity = resourceData.totalQuantity
    }
    
    // Set createdBy
    resourceData.createdBy = user.id
    
    // Create resource
    const resource = await Resource.create(resourceData)
    
    return {
      success: true,
      resource
    }
  } catch (error) {
    console.error('Error creating resource:', error)
    return handleError(event, error)
  }
}) 