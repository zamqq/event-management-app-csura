import { connectDB } from '~/server/utils/db'
import Resource from '~/server/models/Resource'
import { requireAuth } from '~/server/utils/auth'
import { createCustomError, handleError } from '~/server/utils/error'

export default defineEventHandler(async (event) => {
  try {
    // Verify authentication - only admins can update resources
    const user = requireAuth(event, { requireAdmin: true })
    
    // Connect to DB
    await connectDB()
    
    // Get resource ID from params
    const id = event.context.params.id
    
    // Get request body
    const updateData = await readBody(event)
    
    // Find resource by ID
    const existingResource = await Resource.findById(id)
    
    // Check if resource exists
    if (!existingResource) {
      throw createCustomError({
        statusCode: 404,
        statusMessage: 'Resource not found'
      })
    }
    
    // Handle special case for updating quantities
    if (updateData.totalQuantity !== undefined) {
      // If total quantity is being reduced, make sure it's not below used quantity
      const usedQuantity = existingResource.totalQuantity - existingResource.availableQuantity
      
      if (updateData.totalQuantity < usedQuantity) {
        throw createCustomError({
          statusCode: 400,
          statusMessage: `Cannot reduce total quantity below used quantity (${usedQuantity})`
        })
      }
      
      // Update available quantity proportionally
      if (updateData.availableQuantity === undefined) {
        const quantityDiff = updateData.totalQuantity - existingResource.totalQuantity
        updateData.availableQuantity = existingResource.availableQuantity + quantityDiff
      }
    }
    
    // Update resource
    const updatedResource = await Resource.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    )
    

    
    return {
      success: true,
      resource: updatedResource
    }
  } catch (error) {
    console.error('Error updating resource:', error)
    return handleError(event, error)
  }
}) 