export default defineNuxtRouteMiddleware(async (to, from) => {
  // Define public routes that don't require authentication
  const publicRoutes = [
    '/',           // Homepage
    '/login',      // Login page
    '/register'    // Register page
  ]
  
  // Check if current route is public
  const isPublicRoute = publicRoutes.includes(to.path)
  
  // Server-side auth check using cookies/tokens
  if (!import.meta.client) {
    // On server, check for auth token in cookies
    const token = useCookie('auth-token')
    const hasAuthToken = !!token.value
    
    // If user appears to be authenticated and trying to access login/register
    if (hasAuthToken && (to.path === '/login' || to.path === '/register')) {
      return navigateTo('/dashboard')
    }
    
    // If user appears to be unauthenticated and trying to access protected route
    if (!hasAuthToken && !isPublicRoute) {
      return navigateTo('/login')
    }
    
    return
  }
  
  // Client-side: access auth state and wait for it to be determined
  const { isAuthenticated, isLoading } = useAuth()
  
  // Wait for auth state to be determined on client
  while (isLoading.value) {
    await nextTick()
    await new Promise(resolve => setTimeout(resolve, 10))
  }
  
  // If user is not authenticated and trying to access a protected route
  if (!isAuthenticated.value && !isPublicRoute) {
    return navigateTo('/login')
  }
  
  // If user is authenticated and trying to access login/register, redirect to dashboard
  if (isAuthenticated.value && (to.path === '/login' || to.path === '/register')) {
    return navigateTo('/dashboard')
  }
}) 