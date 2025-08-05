<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'

const { user, isAuthenticated, isLoading: authLoading, logout } = useAuth()

const handleLogout = async () => {
  await logout()
  // Navigation is handled by the logout function
}

const isDropdownOpen = ref(false)
const isMobileMenuOpen = ref(false)
const isMobile = ref(false)

const toggleDropdown = () => {
  isDropdownOpen.value = !isDropdownOpen.value
}

const closeDropdown = () => {
  isDropdownOpen.value = false
}

const toggleMobileMenu = () => {
  isMobileMenuOpen.value = !isMobileMenuOpen.value
}

const closeMobileMenu = () => {
  isMobileMenuOpen.value = false
}

const handleKeyDown = (event) => {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault()
    toggleDropdown()
  } else if (event.key === 'Escape') {
    closeDropdown()
  }
}

// Admin check
const isAdmin = computed(() => {
  return isAuthenticated.value && user.value && user.value.role === 'admin'
})

// Update isMobile based on window size
const updateIsMobile = () => {
  isMobile.value = window.innerWidth < 1024
}

// Set up responsive behavior
onMounted(() => {
  updateIsMobile()
  window.addEventListener('resize', updateIsMobile)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', updateIsMobile)
})

// Navigation items
const navItems = [
  { path: '/', label: 'Acasă', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
  { path: '/profile', label: 'Profil', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
  { path: '/rooms', label: 'Săli', icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' },
  { path: '/events', label: 'Evenimente', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
  { path: '/resources', label: 'Resurse', icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10' }
]

// Add admin route if user is admin
const visibleNavItems = computed(() => {
  if (isAdmin.value) {
    return [...navItems, { path: '/admin', label: 'Admin', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z' }]
  }
  return navItems
})
</script>

<template>
  <!-- Show loading screen while auth is being determined -->
  <div v-if="authLoading" class="min-h-screen bg-sky-50 flex items-center justify-center">
    <div class="text-center">
      <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      <p class="mt-2 text-gray-600">Se încarcă...</p>
    </div>
  </div>
  
  <!-- Main app content -->
  <div v-else class="min-h-screen bg-sky-50 flex flex-col">
    <!-- Mobile Header -->
    <header class="lg:hidden bg-white shadow-sm">
      <div class="container mx-auto px-4 py-3 flex items-center justify-between">
        <div class="flex items-center space-x-2">
          <button 
            @click="toggleMobileMenu" 
            class="p-1 rounded-md text-gray-700 hover:bg-gray-100"
            aria-label="Toggle menu"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div class="h-4 w-4 bg-gray-800 rounded-full"></div>
          <NuxtLink to="/" class="font-medium text-gray-800">CS-URA</NuxtLink>
        </div>
        
        <div class="flex items-center space-x-3">
          <ClientOnly>
            <!-- Show these links if user is not authenticated -->
            <template v-if="!isAuthenticated">
              <NuxtLink to="/login" class="text-gray-700 hover:text-gray-900">Conectare</NuxtLink>
              <NuxtLink to="/register" class="bg-gray-800 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition">
                Înregistrare
              </NuxtLink>
            </template>
            
            <!-- Show user dropdown if authenticated -->
            <div v-else class="relative">
              <button 
              @click="toggleDropdown"
              @keydown="handleKeyDown"
              class="flex items-center space-x-2 focus:outline-none"
              aria-haspopup="true"
              :aria-expanded="isDropdownOpen"
              tabindex="0"
              aria-label="User menu"
            >
              <div class="h-8 w-8 rounded-full bg-orange-500 flex items-center justify-center text-white">
                {{ user?.fullName?.charAt(0) || '?' }}
              </div>
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                class="h-4 w-4 text-gray-500"
                :class="{'rotate-180': isDropdownOpen}"
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            <!-- Dropdown Menu -->
            <div 
              v-if="isDropdownOpen"
              class="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-md py-1 z-10"
            >
              <NuxtLink 
                to="/profile"
                class="block px-4 py-2 text-gray-700 hover:bg-gray-100"
                @click="closeDropdown"
              >
                Profil
              </NuxtLink>
              <NuxtLink 
                to="/events?organizerId=current"
                class="block px-4 py-2 text-gray-700 hover:bg-gray-100"
                @click="closeDropdown"
              >
                Evenimentele Mele
              </NuxtLink>
              <button 
                @click="handleLogout"
                class="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100"
                aria-label="Sign out of your account"
              >
                Deconectare
              </button>
            </div>
            </div>
          </ClientOnly>
        </div>
      </div>
    </header>
    
    <!-- Mobile Sidebar (Overlay) -->
    <ClientOnly>
      <div 
        v-if="isMobileMenuOpen" 
        class="lg:hidden fixed inset-0 z-40 flex"
      >
      <!-- Backdrop -->
      <div 
        class="fixed inset-0 bg-gray-600 bg-opacity-75" 
        @click="closeMobileMenu"
        aria-hidden="true"
      ></div>
      
      <!-- Sidebar -->
      <div class="relative flex-1 flex flex-col max-w-xs w-full bg-white">
        <!-- Close button -->
        <div class="absolute top-0 right-0 -mr-12 pt-2">
          <button 
            @click="closeMobileMenu"
            class="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
            aria-label="Close sidebar"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <!-- Sidebar content -->
        <div class="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
          <div class="flex-shrink-0 flex items-center px-4 mb-5">
            <div class="h-6 w-6 bg-gray-800 rounded-full mr-2"></div>
            <span class="font-medium text-lg text-gray-800">CS-URA</span>
          </div>
          
          <nav class="mt-5 px-2 space-y-1">
            <NuxtLink 
              v-for="item in visibleNavItems" 
              :key="item.path"
              :to="item.path"
              class="group flex items-center px-2 py-2 text-base font-medium rounded-md hover:bg-orange-50 hover:text-orange-600"
              :class="$route.path === item.path ? 'bg-orange-100 text-orange-600' : 'text-gray-700'"
              @click="closeMobileMenu"
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                class="mr-4 h-6 w-6"
                :class="$route.path === item.path ? 'text-orange-500' : 'text-gray-500 group-hover:text-orange-500'"
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="item.icon" />
              </svg>
              {{ item.label }}
            </NuxtLink>
          </nav>
        </div>
        
        <!-- Mobile user info -->
        <div class="flex-shrink-0 flex border-t border-gray-200 p-4">
          <ClientOnly>
            <div v-if="isAuthenticated" class="flex items-center">
              <div class="h-10 w-10 rounded-full bg-orange-500 flex items-center justify-center text-white">
                {{ user?.fullName?.charAt(0) || '?' }}
              </div>
              <div class="ml-3">
                <p class="text-base font-medium text-gray-700">{{ user?.fullName }}</p>
                <button 
                  @click="handleLogout"
                  class="text-sm font-medium text-gray-500 hover:text-gray-700"
                >
                  Deconectare
                </button>
              </div>
            </div>
            <div v-else class="flex items-center space-x-4">
              <NuxtLink 
                to="/login"
                class="text-gray-600 hover:text-gray-900 font-medium"
                @click="closeMobileMenu"
              >
                Conectare
              </NuxtLink>
              <NuxtLink 
                to="/register"
                class="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-md transition"
                @click="closeMobileMenu"
              >
                Înregistrare
              </NuxtLink>
            </div>
          </ClientOnly>
        </div>
      </div>
    </div>
    </ClientOnly>
    
    <!-- Desktop Layout (Sidebar + Content) -->
    <div class="flex-grow flex">
      <!-- Desktop Sidebar (fixed) -->
      <div class="hidden lg:flex lg:flex-shrink-0">
        <div class="flex flex-col w-64 border-r border-gray-200 bg-white">
          <!-- Logo -->
          <div class="h-16 flex items-center px-6 border-b border-gray-200">
            <div class="h-6 w-6 bg-orange-500 rounded-full mr-2"></div>
            <span class="font-medium text-lg text-gray-800">CS-URA</span>
          </div>
          
          <!-- Sidebar Navigation -->
          <div class="flex-grow flex flex-col pt-5 pb-4 overflow-y-auto">
            <ClientOnly>
              <nav class="flex-1 px-3 space-y-1">
                <NuxtLink 
                  v-for="item in visibleNavItems" 
                  :key="item.path"
                  :to="item.path"
                  class="group flex items-center px-3 py-2 text-sm font-medium rounded-md hover:bg-orange-50 hover:text-orange-600"
                  :class="$route.path === item.path ? 'bg-orange-100 text-orange-600' : 'text-gray-700'"
                >
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    class="mr-3 h-5 w-5"
                    :class="$route.path === item.path ? 'text-orange-500' : 'text-gray-500 group-hover:text-orange-500'"
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                  >
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="item.icon" />
                  </svg>
                  {{ item.label }}
                </NuxtLink>
              </nav>
              <template #fallback>
                <nav class="flex-1 px-3 space-y-1">
                  <div class="group flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-700">
                    <div class="mr-3 h-5 w-5 bg-gray-300 rounded animate-pulse"></div>
                    <div class="h-4 bg-gray-300 rounded animate-pulse w-20"></div>
                  </div>
                </nav>
              </template>
            </ClientOnly>
          </div>
          
          <!-- User info -->
          <div class="flex-shrink-0 flex border-t border-gray-200 p-4">
            <ClientOnly>
              <div v-if="isAuthenticated" class="flex items-center">
                <div class="h-10 w-10 rounded-full bg-orange-500 flex items-center justify-center text-white">
                  {{ user?.fullName?.charAt(0) || '?' }}
                </div>
                <div class="ml-3 min-w-0 flex-1">
                  <p class="text-sm font-medium text-gray-700 truncate">{{ user?.fullName }}</p>
                  <button 
                    @click="handleLogout"
                    class="text-xs font-medium text-gray-500 hover:text-gray-700"
                  >
                    Deconectare
                  </button>
                </div>
              </div>
              <div v-else class="flex items-center space-x-2">
                <NuxtLink to="/login" class="text-sm text-gray-600 hover:text-gray-900">Conectare</NuxtLink>
                <NuxtLink to="/register" class="text-sm bg-orange-500 hover:bg-orange-600 text-white px-3 py-1 rounded-md transition">
                  Înregistrare
                </NuxtLink>
              </div>
            </ClientOnly>
          </div>
        </div>
      </div>
      
      <!-- Main Content -->
      <div class="flex flex-col w-0 flex-1 overflow-hidden">
        <main class="flex-1 relative overflow-y-auto focus:outline-none">
          <div class="py-6">
            <slot />
          </div>
        </main>
        
        <!-- Footer -->
        <footer class="bg-white border-t border-gray-200 py-4">
          <div class="container mx-auto px-4 md:px-6 lg:px-8">
            <div class="flex flex-col md:flex-row justify-between items-center">
              <div class="mb-4 md:mb-0">
                <p class="text-gray-600 text-sm">&copy; 2025 CS-URA - Universitatea Româno-Americană</p>
              </div>
              <div class="flex space-x-4">
                <a href="https://www.facebook.com/ClubulStudentilorURA" class="text-gray-600 hover:text-gray-900 text-sm">Contact</a>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  </div>
</template> 