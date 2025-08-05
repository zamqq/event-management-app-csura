import { ref, readonly } from 'vue'

// Create state outside of composable to share across instances
const user = ref(null)
const isAuthenticated = ref(false)
const isLoading = ref(true) // Start as loading to prevent flash of content
const error = ref(null)
let authInitialized = false // Track if auth has been initialized

export const useAuth = () => {
  const router = useRouter()
  
  // Initialize auth state from localStorage if available
  const initAuth = async () => {
    // Only access localStorage on client side
    if (!import.meta.client) {
      isLoading.value = false
      return Promise.resolve()
    }
    
    // Prevent multiple initializations
    if (authInitialized) {
      return Promise.resolve()
    }
    
    authInitialized = true
    isLoading.value = true
    error.value = null
    
    // Check if token exists in localStorage
    const token = localStorage.getItem('auth-token')
    
    if (token) {
      // Fetch current user data
      return fetchCurrentUser()
        .catch(() => {
          // Clear invalid token
          localStorage.removeItem('auth-token')
          user.value = null
          isAuthenticated.value = false
        })
        .finally(() => {
          isLoading.value = false
        })
    } else {
      isLoading.value = false
      user.value = null
      isAuthenticated.value = false
      return Promise.resolve()
    }
  }
  
  // Register a new user
  const register = async (userData) => {
    isLoading.value = true
    error.value = null
    
    try {
      const response = await $fetch('/api/auth/register', {
        method: 'POST',
        body: userData
      })
      
      if (response.success) {
        // Set user data
        user.value = response.user
        isAuthenticated.value = true
        
        // Store token in localStorage
        if (response.token) {
          if (import.meta.client) localStorage.setItem('auth-token', response.token)
        }
        
        // Navigate to homepage
        router.push('/')
        return response
      } else {
        error.value = response.message || 'Registration failed'
        throw new Error(error.value)
      }
    } catch (err) {
      error.value = err.message || 'Registration failed'
      throw err
    } finally {
      isLoading.value = false
    }
  }
  
  // Login a user
  const login = async (credentials) => {
    isLoading.value = true
    error.value = null
    
    try {
      const response = await $fetch('/api/auth/login', {
        method: 'POST',
        body: credentials
      })
      
      if (response.success) {
        // Set user data
        user.value = response.user
        isAuthenticated.value = true
        
        // Store token in localStorage
        if (response.token) {
          if (import.meta.client) localStorage.setItem('auth-token', response.token)
        }
        
        // Navigate to homepage
        router.push('/')
        return response
      } else {
        error.value = response.message || 'Login failed'
        throw new Error(error.value)
      }
    } catch (err) {
      error.value = err.message || 'Login failed'
      throw err
    } finally {
      isLoading.value = false
    }
  }
  
  // Logout a user
  const logout = async () => {
    isLoading.value = true
    error.value = null
    
    try {
      await $fetch('/api/auth/logout', {
        method: 'POST'
      })
      
      // Clear auth state
      user.value = null
      isAuthenticated.value = false
      
          // Remove token from localStorage
    if (import.meta.client) localStorage.removeItem('auth-token')
      
      // Navigate to home page
      router.push('/login')
    } catch (err) {
      error.value = err.message || 'Logout failed'
    } finally {
      isLoading.value = false
    }
  }
  
  // Fetch current user
  const fetchCurrentUser = async () => {
    isLoading.value = true
    error.value = null
    
    try {
      const response = await $fetch('/api/auth/me', {
              headers: {
        Authorization: `Bearer ${import.meta.client ? localStorage.getItem('auth-token') : ''}`
      }
      })
      
      if (response.success) {
        // Set user data
        user.value = response.user
        isAuthenticated.value = true
        return response
      } else {
        error.value = response.message || 'Failed to fetch user data'
        throw new Error(error.value)
      }
    } catch (err) {
      error.value = err.message || 'Failed to fetch user data'
      throw err
    } finally {
      isLoading.value = false
    }
  }
  
  // Initialize auth state on composable creation
  if (import.meta.client) {
    // Only run in client-side
    initAuth()
  }
  
  return {
    user: readonly(user),
    isAuthenticated: readonly(isAuthenticated),
    isLoading: readonly(isLoading),
    error: readonly(error),
    register,
    login,
    logout,
    fetchCurrentUser,
    initAuth
  }
} 