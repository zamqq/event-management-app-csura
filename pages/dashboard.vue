<script setup>
import { ref, computed } from 'vue'

definePageMeta({
  layout: 'default'
})

const router = useRouter()
const { user } = useAuth()

// Dashboard quick links
const dashboardLinks = [
  {
    name: 'Explorează Sălile',
    description: 'Găsește și rezervă săli disponibile',
    route: '/rooms',
    icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6'
  },
  {
    name: 'Rezervările Mele',
    description: 'Vezi și gestionează rezervările tale curente de săli',
    route: '/reservations',
    icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z'
  },
  {
    name: 'Profil',
    description: 'Vezi și actualizează profilul tău de utilizator',
    route: '/profile',
    icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z'
  }
]

// Admin section
const isAdmin = computed(() => {
  return user.value?.role === 'admin'
})

const adminLinks = [
  {
    name: 'Panoul Admin',
    description: 'Accesează instrumentele admin și rapoartele',
    route: '/admin',
    icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z'
  }
]

const navigateTo = (route) => {
  router.push(route)
}

const handleKeyDown = (event, route) => {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault()
    navigateTo(route)
  }
}
</script>

<template>
  <div class="container mx-auto px-4 py-8">
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-gray-900 mb-2">Bun venit, {{ user?.fullName }}</h1>
      <p class="text-gray-600">Gestionează sălile și rezervările tale la CS-URA</p>
    </div>
    
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <div 
        v-for="(link, index) in dashboardLinks" 
        :key="index"
        class="bg-white rounded-lg shadow-md overflow-hidden transition-transform hover:translate-y-[-4px] cursor-pointer"
        @click="navigateTo(link.route)"
        @keydown="(event) => handleKeyDown(event, link.route)"
        tabindex="0"
        :aria-label="`Navigate to ${link.name}`"
      >
        <div class="p-6">
          <div class="flex items-center mb-4">
            <div class="bg-orange-100 h-10 w-10 rounded-full flex items-center justify-center mr-3">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="link.icon" />
              </svg>
            </div>
            <h3 class="text-xl font-semibold text-gray-900">{{ link.name }}</h3>
          </div>
          <p class="text-gray-600">{{ link.description }}</p>
        </div>
      </div>
    </div>
    
    <!-- Admin section -->
    <div v-if="isAdmin" class="mb-8">
      <h2 class="text-2xl font-bold text-gray-900 mb-4">Administrare</h2>
      
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div 
          v-for="(link, index) in adminLinks" 
          :key="index"
          class="bg-white rounded-lg shadow-md overflow-hidden transition-transform hover:translate-y-[-4px] cursor-pointer border-l-4 border-orange-500"
          @click="navigateTo(link.route)"
          @keydown="(event) => handleKeyDown(event, link.route)"
          tabindex="0"
          :aria-label="`Navigate to ${link.name}`"
        >
          <div class="p-6">
            <div class="flex items-center mb-4">
              <div class="bg-orange-100 h-10 w-10 rounded-full flex items-center justify-center mr-3">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="link.icon" />
                </svg>
              </div>
              <h3 class="text-xl font-semibold text-gray-900">{{ link.name }}</h3>
            </div>
            <p class="text-gray-600">{{ link.description }}</p>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Recent activity placeholder -->
    <div class="bg-white rounded-lg shadow-md p-6">
      <h2 class="text-2xl font-bold text-gray-900 mb-4">Activitate Recentă</h2>
      <p class="text-gray-600">Nu ai activitate recentă de afișat.</p>
    </div>
  </div>
</template>

