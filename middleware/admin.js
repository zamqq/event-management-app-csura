export default defineNuxtRouteMiddleware((to, from) => {
  // Skip middleware during server-side rendering
  if (!process.client) return
  
  const { isAuthenticated, user, isLoading } = useAuth()
  
  // Wait for auth state to be determined
  if (isLoading.value) {
    return
  }
  
  // If not authenticated, let global middleware handle it
  if (!isAuthenticated.value) {
    return
  }
  
  // Check if user has admin role
  if (!user.value || user.value.role !== 'admin') {

    throw createError({
      statusCode: 403,
      statusMessage: 'Access denied. Admin privileges required.'
    })
  }
}) 