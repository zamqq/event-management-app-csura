import { clearAuthCookie } from '~/server/utils/auth'
import { handleError } from '~/server/utils/error'

export default defineEventHandler(async (event) => {
  try {
    // Clear the auth cookie
    clearAuthCookie(event)
    

    
    return {
      success: true,
      message: 'Logged out successfully'
    }
  } catch (error) {
    console.error('Logout error:', error)
    return handleError(event, error)
  }
}) 