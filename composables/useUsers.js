import { ref, readonly } from 'vue'

export const useUsers = () => {
  const users = ref([])
  const isLoading = ref(false)
  const error = ref(null)

  // Get authentication token from localStorage
  const getAuthToken = () => {
    if (process.client) {
      return localStorage.getItem('auth-token')
    }
    return null
  }

  // Fetch all users
  const fetchUsers = async (searchParams = {}) => {
    isLoading.value = true
    error.value = null

    try {
      const token = getAuthToken()
      
      if (!token) {
        throw new Error('No authentication token found')
      }

      // Build query params
      let queryParams = new URLSearchParams()
      
      if (searchParams.search?.trim()) {
        queryParams.append('search', searchParams.search.trim())
      }
      
      if (searchParams.role) {
        queryParams.append('role', searchParams.role)
      }
      
      const query = queryParams.toString() ? `?${queryParams.toString()}` : ''

      const response = await $fetch(`/api/users${query}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      if (response.success) {
        users.value = response.users
        return response
      } else {
        error.value = response.message || 'Failed to fetch users'
        throw new Error(error.value)
      }
    } catch (err) {
      error.value = err.message || 'Failed to fetch users'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  // Update user
  const updateUser = async (userId, userData) => {
    isLoading.value = true
    error.value = null

    try {
      const token = getAuthToken()
      
      if (!token) {
        throw new Error('No authentication token found')
      }

      const response = await $fetch(`/api/users/${userId}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: userData
      })

      if (response.success) {
        // Update the user in the local array
        const userIndex = users.value.findIndex(user => user._id === userId)
        if (userIndex !== -1) {
          users.value[userIndex] = response.user
        }
        return response
      } else {
        error.value = response.message || 'Failed to update user'
        throw new Error(error.value)
      }
    } catch (err) {
      error.value = err.message || 'Failed to update user'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  // Delete user
  const deleteUser = async (userId) => {
    isLoading.value = true
    error.value = null

    try {
      const token = getAuthToken()
      
      if (!token) {
        throw new Error('No authentication token found')
      }

      const response = await $fetch(`/api/users/${userId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      if (response.success) {
        // Remove the user from the local array
        const userIndex = users.value.findIndex(user => user._id === userId)
        if (userIndex !== -1) {
          users.value.splice(userIndex, 1)
        }
        return response
      } else {
        error.value = response.message || 'Failed to delete user'
        throw new Error(error.value)
      }
    } catch (err) {
      error.value = err.message || 'Failed to delete user'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  // Get user by ID
  const getUserById = (userId) => {
    return users.value.find(user => user._id === userId)
  }

  // Clear error
  const clearError = () => {
    error.value = null
  }

  return {
    users: readonly(users),
    isLoading: readonly(isLoading),
    error: readonly(error),
    fetchUsers,
    updateUser,
    deleteUser,
    getUserById,
    clearError
  }
} 