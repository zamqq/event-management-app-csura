<script setup>
definePageMeta({
  layout: 'default',
  middleware: 'admin'
})

const router = useRouter()
const { user } = useAuth()

// Admin functions with their routes and descriptions
const adminFunctions = [
  {
    name: 'Gestionarea Sălilor',
    description: 'Adaugă, editează și șterge săli',
    route: '/rooms',
    icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10'
  },
  {
    name: 'Gestionarea Utilizatorilor',
    description: 'Gestionează utilizatorii și rolurile',
    route: '/admin/users',
    icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z'
  },
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
    <h1 class="text-3xl font-bold text-gray-900 mb-8">Panoul Admin</h1>
    
    <div class="bg-white rounded-lg shadow-md p-6 mb-8">
      <div v-if="user" class="flex items-center mb-6">
        <div class="h-12 w-12 rounded-full bg-orange-500 flex items-center justify-center text-white text-xl">
          {{ user.fullName.charAt(0) }}
        </div>
        <div class="ml-4">
          <h2 class="text-xl font-semibold text-gray-900">Bun venit, {{ user.fullName }}</h2>
          <p class="text-gray-600">Administrator</p>
        </div>
      </div>
      
      <p class="text-gray-700">
        Bun venit la panoul admin CS-URA. De aici, poți gestiona sălile, 
        utilizatorii și rezervările pentru Clubul Studenților Universității Româno-Americane.
      </p>
    </div>
    
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div 
        v-for="(func, index) in adminFunctions" 
        :key="index"
        class="bg-white rounded-lg shadow-md overflow-hidden transition-transform hover:translate-y-[-4px] cursor-pointer"
        @click="navigateTo(func.route)"
        @keydown="(event) => handleKeyDown(event, func.route)"
        tabindex="0"
        :aria-label="`Navigate to ${func.name}`"
      >
        <div class="p-6">
          <div class="flex items-start">
            <div class="bg-orange-100 h-12 w-12 rounded-full flex items-center justify-center mr-4">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="func.icon" />
              </svg>
            </div>
            <div>
              <h3 class="text-xl font-semibold text-gray-900 mb-2">{{ func.name }}</h3>
              <p class="text-gray-600">{{ func.description }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template> 