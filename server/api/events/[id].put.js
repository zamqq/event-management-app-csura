import { connectDB } from '~/server/utils/db'
import Event from '~/server/models/Event'
import Room from '~/server/models/Room'
import Resource from '~/server/models/Resource'
import { requireAuth } from '~/server/utils/auth'
import { createCustomError, handleError } from '~/server/utils/error'

// Helper function to check for time conflicts
const checkTimeConflict = (startTime1, endTime1, startTime2, endTime2) => {
  // Convert time strings to minutes for easier comparison
  const timeToMinutes = (timeStr) => {
    const [hours, minutes] = timeStr.split(':').map(Number)
    return hours * 60 + minutes
  }
  
  const start1 = timeToMinutes(startTime1)
  const end1 = timeToMinutes(endTime1)
  const start2 = timeToMinutes(startTime2)
  const end2 = timeToMinutes(endTime2)
  
  // Check if times overlap
  return (start1 < end2) && (start2 < end1)
}

export default defineEventHandler(async (event) => {
  try {
    // Verify authentication
    const user = requireAuth(event)
    
    // Connect to DB
    await connectDB()
    
    // Get event ID from params
    const id = event.context.params.id
    
    // Get request body
    const updateData = await readBody(event)
    
    // Find event by ID
    const existingEvent = await Event.findById(id)
      .populate('resources.resource')
    
    // Check if event exists
    if (!existingEvent) {
      throw createCustomError({
        statusCode: 404,
        statusMessage: 'Event not found'
      })
    }
    
    // Check if user is authorized to update this event
    // Either the organizer or an admin can update
    if (existingEvent.organizer.toString() !== user.id && user.role !== 'admin') {
      throw createCustomError({
        statusCode: 403,
        statusMessage: 'You are not authorized to update this event'
      })
    }
    
    // If room is being changed, check if new room exists and is available
    if (updateData.room && updateData.room !== existingEvent.room.toString()) {
      const newRoom = await Room.findById(updateData.room)
      if (!newRoom) {
        throw createCustomError({
          statusCode: 404,
          statusMessage: 'Room not found'
        })
      }
      
      if (!newRoom.isAvailable) {
        throw createCustomError({
          statusCode: 400,
          statusMessage: 'Selected room is not available for booking'
        })
      }
    }
    
    // Check for conflicts if date, time, or room is being changed
    const isDateChanged = updateData.eventDate && new Date(updateData.eventDate).getTime() !== new Date(existingEvent.eventDate).getTime()
    const isTimeChanged = (updateData.startTime && updateData.startTime !== existingEvent.startTime) || 
                         (updateData.endTime && updateData.endTime !== existingEvent.endTime)
    const isRoomChanged = updateData.room && updateData.room !== existingEvent.room.toString()
    
    if (isDateChanged || isTimeChanged || isRoomChanged) {
      const checkRoom = updateData.room || existingEvent.room
      const checkDate = updateData.eventDate || existingEvent.eventDate
      const checkStartTime = updateData.startTime || existingEvent.startTime
      const checkEndTime = updateData.endTime || existingEvent.endTime
      
      // Find the room for error message
      const roomDoc = await Room.findById(checkRoom)
      
      // Check for conflicting events in the same room and date (excluding current event)
      const conflictingEvents = await Event.find({
        _id: { $ne: id }, // Exclude current event
        room: checkRoom,
        eventDate: new Date(checkDate),
        status: { $nin: ['cancelled', 'rejected'] } // Exclude cancelled and rejected events
      }).populate('organizer', 'fullName email')
      
      // Check for time conflicts
      for (const conflictEvent of conflictingEvents) {
        if (checkTimeConflict(checkStartTime, checkEndTime, conflictEvent.startTime, conflictEvent.endTime)) {
          throw createCustomError({
            statusCode: 409, // Conflict status code
            statusMessage: `Conflict detected. The room "${roomDoc?.name || 'selected room'}" is already booked from ${conflictEvent.startTime} to ${conflictEvent.endTime} on this date by ${conflictEvent.organizer?.fullName || 'alt utilizator'}.`
          })
        }
      }
    }
    
    // Handle resource changes
    if (updateData.resources && Array.isArray(updateData.resources)) {
      // Create a map of existing resources by resource ID for easy lookup
      const existingResourceMap = {}
      if (existingEvent.resources && Array.isArray(existingEvent.resources)) {
        existingEvent.resources.forEach(item => {
          const resourceId = item.resource._id ? item.resource._id.toString() : item.resource.toString()
          existingResourceMap[resourceId] = {
            quantity: item.quantity,
            resource: item.resource
          }
        })
      }
      
      // Process each resource in the update
      const resourcePromises = updateData.resources.map(async (resourceRequest) => {
        if (!resourceRequest.resource) return null;
        
        const resourceId = resourceRequest.resource.toString()
        const existing = existingResourceMap[resourceId]
        
        // If resource already exists in this event, calculate the difference
        if (existing) {
          const quantityDiff = resourceRequest.quantity - existing.quantity
          
          // If quantity increased, check availability
          if (quantityDiff > 0) {
            const resourceDoc = await Resource.findById(resourceId)
            if (!resourceDoc) {
              throw createCustomError({
                statusCode: 404,
                statusMessage: `Resource with ID ${resourceId} not found`
              })
            }
            
            if (!resourceDoc.isAvailable) {
              throw createCustomError({
                statusCode: 400,
                statusMessage: `Resource ${resourceDoc.name} is not available`
              })
            }
            
            if (resourceDoc.availableQuantity < quantityDiff) {
              throw createCustomError({
                statusCode: 400,
                statusMessage: `Insufficient quantity for resource ${resourceDoc.name}. Additional needed: ${quantityDiff}, Available: ${resourceDoc.availableQuantity}`
              })
            }
            
            // Update available quantity
            resourceDoc.availableQuantity -= quantityDiff
            await resourceDoc.save()
          } 
          // If quantity decreased, return the difference to available
          else if (quantityDiff < 0) {
            const resourceDoc = await Resource.findById(resourceId)
            if (resourceDoc) {
              resourceDoc.availableQuantity += Math.abs(quantityDiff)
              await resourceDoc.save()
            }
          }
          
          // Remove this resource from the map since we've processed it
          delete existingResourceMap[resourceId]
        } 
        // If this is a new resource being added
        else {
          const resourceDoc = await Resource.findById(resourceId)
          if (!resourceDoc) {
            throw createCustomError({
              statusCode: 404,
              statusMessage: `Resource with ID ${resourceId} not found`
            })
          }
          
          if (!resourceDoc.isAvailable) {
            throw createCustomError({
              statusCode: 400,
              statusMessage: `Resource ${resourceDoc.name} is not available`
            })
          }
          
          if (resourceDoc.availableQuantity < resourceRequest.quantity) {
            throw createCustomError({
              statusCode: 400,
              statusMessage: `Insufficient quantity for resource ${resourceDoc.name}. Requested: ${resourceRequest.quantity}, Available: ${resourceDoc.availableQuantity}`
            })
          }
          
          // Update available quantity
          resourceDoc.availableQuantity -= resourceRequest.quantity
          await resourceDoc.save()
        }
      })
      
      // Handle resources that were removed from the event
      const removedResourcePromises = Object.values(existingResourceMap).map(async (item) => {
        const resourceId = item.resource._id ? item.resource._id.toString() : item.resource.toString()
        const resourceDoc = await Resource.findById(resourceId)
        
        // Return the quantity back to available
        if (resourceDoc) {
          resourceDoc.availableQuantity += item.quantity
          await resourceDoc.save()
        }
      })
      
      // Wait for all resource operations to complete
      await Promise.all([...resourcePromises, ...removedResourcePromises])
    }
    
    // Handle legacy resources
    if (updateData.legacyResources) {
      // Nothing special to do with legacy resources
    } else if (Array.isArray(updateData.resources) && updateData.resources.some(r => typeof r === 'string')) {
      // If resources is array of strings, move them to legacyResources
      updateData.legacyResources = updateData.resources.filter(r => typeof r === 'string')
      updateData.resources = updateData.resources.filter(r => typeof r === 'object' && r !== null)
    }
    
    // Update event
    const updatedEvent = await Event.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate('room', 'name location capacity image')
     .populate('resources.resource', 'name description category image')
     .populate('organizer', 'fullName email')
    
    return {
      success: true,
      event: updatedEvent
    }
  } catch (error) {
    console.error('Error updating event:', error)
    return handleError(event, error)
  }
}) 