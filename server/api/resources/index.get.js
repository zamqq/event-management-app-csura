import { connectDB } from '~/server/utils/db'
import Resource from '~/server/models/Resource'
import { handleError } from '~/server/utils/error'

export default defineEventHandler(async (event) => {
  try {
    // Connect to DB
    await connectDB()
    
    // Parse query params
    const query = getQuery(event)
    const { search, category, isAvailable, minQuantity } = query
    const filter = {}
    
    // Search functionality for resource name and description
    if (search) {
      const searchRegex = new RegExp(search, 'i') // Case-insensitive search
      filter.$or = [
        { name: searchRegex },
        { description: searchRegex }
      ]
    }
    
    // Filter by category
    if (category) {
      filter.category = category
    }
    
    // Filter by availability
    if (isAvailable === 'true') {
      filter.isAvailable = true
      filter.availableQuantity = { $gt: 0 }
    }
    
    // Filter by minimum quantity
    if (minQuantity) {
      const minQty = parseInt(minQuantity)
      if (!isNaN(minQty) && minQty > 0) {
        filter.availableQuantity = { 
          ...filter.availableQuantity,
          $gte: minQty 
        }
      }
    }
    
    // Get resources
    const resources = await Resource.find(filter)
      .sort({ createdAt: -1 })
    
    return {
      success: true,
      resources
    }
  } catch (error) {
    console.error('Error fetching resources:', error)
    return handleError(event, error)
  }
}) 