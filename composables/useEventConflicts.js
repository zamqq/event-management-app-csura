export const useEventConflicts = () => {
  const conflictError = ref('')
  const isCheckingConflicts = ref(false)

  // Helper function to check for time conflicts
  const checkTimeConflict = (startTime1, endTime1, startTime2, endTime2) => {
    const timeToMinutes = (timeStr) => {
      const [hours, minutes] = timeStr.split(':').map(Number)
      return hours * 60 + minutes
    }
    
    const start1 = timeToMinutes(startTime1)
    const end1 = timeToMinutes(endTime1)
    const start2 = timeToMinutes(startTime2)
    const end2 = timeToMinutes(endTime2)
    
    return (start1 < end2) && (start2 < end1)
  }

  // Check for conflicts when room, date, or time changes
  const checkForConflicts = async (eventData, excludeEventId = null, selectedRoom = null) => {
    // Clear previous conflict error
    conflictError.value = ''
    
    // Only check if we have all required fields
    if (!eventData.room || !eventData.eventDate || 
        !eventData.startTime || !eventData.endTime) {
      return
    }
    
    try {
      isCheckingConflicts.value = true
      
      // Fetch events for the selected room and date
      const response = await fetch(`/api/events?roomId=${eventData.room}&fromDate=${eventData.eventDate}&toDate=${eventData.eventDate}`)
      
      if (!response.ok) {
        console.error('Failed to check for conflicts')
        return
      }
      
      const data = await response.json()
      
      if (data.success && data.events) {
        // Check for time conflicts with existing events
        const conflicts = data.events.filter(event => {
          // Skip the current event being edited (if provided)
          if (excludeEventId && event._id === excludeEventId) {
            return false
          }
          
          // Skip cancelled and rejected events
          if (event.status === 'cancelled' || event.status === 'rejected') {
            return false
          }
          
          return checkTimeConflict(
            eventData.startTime,
            eventData.endTime,
            event.startTime,
            event.endTime
          )
        })
        
        if (conflicts.length > 0) {
          const conflict = conflicts[0]
          const roomName = selectedRoom?.name || 'this room'
          conflictError.value = `Conflict detected. The room is already booked from ${conflict.startTime} to ${conflict.endTime} on this date by ${conflict.organizer?.fullName || 'alt utilizator'}.`
        }
      }
    } catch (error) {
      console.error('Error checking for conflicts:', error)
    } finally {
      isCheckingConflicts.value = false
    }
  }

  // Debounced conflict check
  const debouncedConflictCheck = (eventData, excludeEventId = null, selectedRoom = null) => {
    setTimeout(() => checkForConflicts(eventData, excludeEventId, selectedRoom), 500)
  }

  return {
    conflictError: readonly(conflictError),
    isCheckingConflicts: readonly(isCheckingConflicts),
    checkTimeConflict,
    checkForConflicts,
    debouncedConflictCheck
  }
} 