import { connectDB } from '~/server/utils/db'
import Event from '~/server/models/Event'
import Room from '~/server/models/Room'
import Resource from '~/server/models/Resource'
import { requireAuth } from '~/server/utils/auth'
import { createCustomError, handleError } from '~/server/utils/error'
import { setResponseStatus } from 'h3'

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

export default defineEventHandler(async (req) => {
  try {
    // Verify authentication
    const user = requireAuth(req)
    
    // Connect to DB
    await connectDB()
    
    // Get request body
    const eventData = await readBody(req)
    
    // Validate required fields
    const { name, room, eventDate, startTime, endTime } = eventData
    if (!name || !room || !eventDate || !startTime || !endTime) {
      throw createCustomError({
        statusCode: 400,
        statusMessage: 'Event name, room, date, start time, and end time are required'
      })
    }
    
    // Check if room exists and is available
    const roomDoc = await Room.findById(room)
    if (!roomDoc) {
      throw createCustomError({
        statusCode: 404,
        statusMessage: 'Room not found'
      })
    }
    
    if (!roomDoc.isAvailable) {
      throw createCustomError({
        statusCode: 400,
        statusMessage: 'Room is not available for booking'
      })
    }
    
    // Check for conflicting events in the same room and date
    const conflictingEvents = await Event.find({
      room: room,
      eventDate: new Date(eventDate),
      status: { $nin: ['cancelled', 'rejected'] } // Exclude cancelled and rejected events
    }).populate('organizer', 'fullName email')
    
    // Check for time conflicts
    for (const existingEvent of conflictingEvents) {
      if (checkTimeConflict(startTime, endTime, existingEvent.startTime, existingEvent.endTime)) {
        throw createCustomError({
          statusCode: 409, // Conflict status code
          statusMessage: `Time conflict detected. The room "${roomDoc.name}" is already booked from ${existingEvent.startTime} to ${existingEvent.endTime} on this date by ${existingEvent.organizer?.fullName || 'another user'}.`
        })
      }
    }
    
    // Handle resources
    let resourcesValid = true
    let errorMessage = ''
    
    // Check if we have the new resource format
    if (eventData.resources && Array.isArray(eventData.resources) && eventData.resources.length > 0) {
      const resourcePromises = eventData.resources.map(async (resourceRequest) => {
        // Skip if resource is not specified
        if (!resourceRequest.resource) return true;
        
        // Check if resource exists and has sufficient quantity
        const resourceDoc = await Resource.findById(resourceRequest.resource)
        
        if (!resourceDoc) {
          errorMessage = `Resource with ID ${resourceRequest.resource} not found`
          return false
        }
        
        if (!resourceDoc.isAvailable) {
          errorMessage = `Resource ${resourceDoc.name} is not available`
          return false
        }
        
        if (resourceDoc.availableQuantity < resourceRequest.quantity) {
          errorMessage = `Insufficient quantity for resource ${resourceDoc.name}. Requested: ${resourceRequest.quantity}, Available: ${resourceDoc.availableQuantity}`
          return false
        }
        
        // Reserve the resources (reduce available quantity)
        resourceDoc.availableQuantity -= resourceRequest.quantity
        await resourceDoc.save()
        
        return true
      })
      
      // Wait for all resource checks to complete
      const results = await Promise.all(resourcePromises)
      resourcesValid = results.every(result => result === true)
      
      if (!resourcesValid) {
        throw createCustomError({
          statusCode: 400,
          statusMessage: errorMessage || 'Issue with requested resources'
        })
      }
    }
    
    // Handle legacy resources format
    if (eventData.legacyResources) {
      // Nothing special to do with legacy resources, just track them
    } else if (Array.isArray(eventData.resources) && eventData.resources.some(r => typeof r === 'string')) {
      // If resources is array of strings, move them to legacyResources
      eventData.legacyResources = eventData.resources.filter(r => typeof r === 'string')
      eventData.resources = eventData.resources.filter(r => typeof r === 'object' && r !== null)
    }
    
    // Create event data with all required fields including organizer
    const finalEventData = {
      ...eventData,
      organizer: user.id  // Use the ID from the JWT token
    }
    
    // Create new event
    let newEvent
    try {
      newEvent = await Event.create(finalEventData)
    } catch (createError) {
      console.error('Error creating event in database:', createError)
      throw createCustomError({
        statusCode: 500,
        statusMessage: `Failed to create event: ${createError.message}`
      })
    }
    
    // Verify that the event was created
    if (!newEvent || !newEvent._id) {
      throw createCustomError({
        statusCode: 500,
        statusMessage: 'Event creation failed without an error'
      })
    }
    
    // Populate room, resources, and organizer information
    let createdEvent
    try {
      createdEvent = await Event.findById(newEvent._id)
        .populate('room', 'name location capacity image')
        .populate('resources.resource', 'name description category image')
        .populate('organizer', 'fullName email')
      
      if (!createdEvent) {
        throw new Error('Could not find the created event')
      }
    } catch (populateError) {
      console.error('Error populating event data:', populateError)
      // Don't throw here, we'll return the basic event if population fails
      createdEvent = newEvent
    }
    
    // Set successful status code (201 Created)
    setResponseStatus(req, 201, 'Created')
    
    // Return success response
    return {
      success: true,
      event: createdEvent
    }
  } catch (error) {
    console.error('Error creating event:', error)
    return handleError(req, error)
  }
}) 