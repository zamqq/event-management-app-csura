import { ref, readonly } from 'vue'

// Create state outside of composable to share across instances
const rooms = ref([])
const currentRoom = ref(null)
const isLoading = ref(false)
const error = ref(null)

export const useRooms = () => {
  // Get all rooms with optional filters
  const fetchRooms = async (filters = {}) => {
    isLoading.value = true
    error.value = null
    
    try {
      // Build query string from filters
      const queryParams = new URLSearchParams()
      
      if (filters.isAvailable !== undefined) {
        queryParams.append('isAvailable', filters.isAvailable)
      }
      
      if (filters.minCapacity) {
        queryParams.append('minCapacity', filters.minCapacity)
      }
      
      if (filters.facilities && filters.facilities.length) {
        filters.facilities.forEach(facility => {
          queryParams.append('facilities', facility)
        })
      }
      
      if (filters.search) {
        queryParams.append('search', filters.search)
      }
      
      const queryString = queryParams.toString()
      const url = `/api/rooms${queryString ? `?${queryString}` : ''}`
      
      const response = await $fetch(url)
      
      if (response.success) {
        rooms.value = response.rooms
        return response.rooms
      } else {
        throw new Error(response.message || 'Failed to fetch rooms')
      }
    } catch (err) {
      error.value = err.message || 'Failed to fetch rooms'
      throw err
    } finally {
      isLoading.value = false
    }
  }
  
  // Get room by ID
  const fetchRoomById = async (id) => {
    isLoading.value = true
    error.value = null
    
    try {
      const response = await $fetch(`/api/rooms/${id}`)
      
      if (response.success) {
        currentRoom.value = response.room
        return response.room
      } else {
        throw new Error(response.message || 'Failed to fetch room')
      }
    } catch (err) {
      error.value = err.message || 'Failed to fetch room'
      throw err
    } finally {
      isLoading.value = false
    }
  }
  
  // Create a new room
  const createRoom = async (roomData) => {
    isLoading.value = true
    error.value = null
    
    try {
      const response = await $fetch('/api/rooms', {
        method: 'POST',
        body: roomData
      })
      
      if (response.success) {
        // Add the new room to the rooms array
        rooms.value.push(response.room)
        return response.room
      } else {
        throw new Error(response.message || 'Failed to create room')
      }
    } catch (err) {
      error.value = err.message || 'Failed to create room'
      throw err
    } finally {
      isLoading.value = false
    }
  }
  
  // Update a room
  const updateRoom = async (id, roomData) => {
    isLoading.value = true
    error.value = null
    
    try {
      const response = await $fetch(`/api/rooms/${id}`, {
        method: 'PUT',
        body: roomData
      })
      
      if (response.success) {
        // Update the room in the rooms array
        const index = rooms.value.findIndex(r => r._id === id)
        if (index !== -1) {
          rooms.value[index] = response.room
        }
        
        // Update currentRoom if it's the same room
        if (currentRoom.value && currentRoom.value._id === id) {
          currentRoom.value = response.room
        }
        
        return response.room
      } else {
        throw new Error(response.message || 'Failed to update room')
      }
    } catch (err) {
      error.value = err.message || 'Failed to update room'
      throw err
    } finally {
      isLoading.value = false
    }
  }
  
  // Delete a room
  const deleteRoom = async (id) => {
    isLoading.value = true
    error.value = null
    
    try {
      const response = await $fetch(`/api/rooms/${id}`, {
        method: 'DELETE'
      })
      
      if (response.success) {
        // Remove the room from the rooms array
        rooms.value = rooms.value.filter(r => r._id !== id)
        
        // Clear currentRoom if it's the same room
        if (currentRoom.value && currentRoom.value._id === id) {
          currentRoom.value = null
        }
        
        return true
      } else {
        throw new Error(response.message || 'Failed to delete room')
      }
    } catch (err) {
      error.value = err.message || 'Failed to delete room'
      throw err
    } finally {
      isLoading.value = false
    }
  }
  
  return {
    rooms: readonly(rooms),
    currentRoom: readonly(currentRoom),
    isLoading: readonly(isLoading),
    error: readonly(error),
    fetchRooms,
    fetchRoomById,
    createRoom,
    updateRoom,
    deleteRoom
  }
} 