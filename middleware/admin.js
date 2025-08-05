export default defineNuxtRouteMiddleware((to) => {
  // Skip middleware during server-side rendering
  if (!import.meta.client) return
  
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
    // Show error message using toast
    const toast = useToast()
    toast.error('Acces interzis. Doar administratorii pot accesa această pagină.')
    
    // Redirect to homepage
    return navigateTo('/')
  }
}) 