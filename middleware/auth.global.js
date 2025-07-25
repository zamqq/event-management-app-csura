export default defineNuxtRouteMiddleware((to, from) => {
  // Skip middleware during server-side rendering
  if (!process.client) return
  
  const { isAuthenticated, isLoading } = useAuth()
  
  // Wait for auth state to be determined
  if (isLoading.value) {
    return
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
  
  // If user is authenticated and trying to access login/register, redirect to dashboard
  if (isAuthenticated.value && (to.path === '/login' || to.path === '/register')) {

    return navigateTo('/dashboard')
  }
}) 