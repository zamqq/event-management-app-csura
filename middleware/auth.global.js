export default defineNuxtRouteMiddleware(async (to) => {
  // Skip middleware during server-side rendering
  if (!import.meta.client) return
  
  // Only access auth state on client side
  const { isAuthenticated, isLoading, initAuth } = useAuth()
  
  // Initialize auth if not already done
  await initAuth()
  
  // Wait for any ongoing auth checks to complete (with timeout)
  let timeout = 0
  while (isLoading.value && timeout < 500) { // Max 5 seconds
    await new Promise(resolve => setTimeout(resolve, 10))
    timeout++
  }
  
  // If still loading after timeout, assume no auth and continue
  if (isLoading.value) {
    console.warn('Auth initialization timed out')
  }
  
  // Define public routes that don't require authentication
  const publicRoutes = [
    '/',           // Homepage
    '/login',      // Login page
    '/register'    // Register page
  ]
  
  // Check if current route is public
  const isPublicRoute = publicRoutes.includes(to.path)
  
  // If user is not authenticated and trying to access a protected route
  if (!isAuthenticated.value && !isPublicRoute) {
    return navigateTo('/login')
  }
  
  // If user is authenticated and trying to access login/register, redirect to home
  if (isAuthenticated.value && (to.path === '/login' || to.path === '/register')) {
    return navigateTo('/')
  }
}) 