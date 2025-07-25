<script setup>
import { ref, onMounted } from 'vue'

definePageMeta({
  layout: 'default'
})

const { rooms, isLoading, error, fetchRooms, deleteRoom } = useRooms()
const { isAuthenticated, user } = useAuth()
const toast = useToast()

// Search and filter state
const searchQuery = ref('')
const selectedFacilities = ref([])
const minCapacity = ref('')
const showOnlyAvailable = ref(false)

const facilitiesList = [
  'Videoproiector',
  'Tabla Alba',
  'Calculator',
  'Sistem Audio',
  'Aer Conditionat',
  'Tabla Digitala',
  'Altele'
]

// Admin check
const isAdmin = computed(() => {
  return isAuthenticated.value && user.value && user.value.role === 'admin'
})

// Apply filters
const applyFilters = async () => {
  await fetchRooms({
    search: searchQuery.value,
    facilities: selectedFacilities.value,
    minCapacity: minCapacity.value || undefined,
    isAvailable: showOnlyAvailable.value ? true : undefined
  })
}

// Reset filters
const resetFilters = () => {
  searchQuery.value = ''
  selectedFacilities.value = []
  minCapacity.value = ''
  showOnlyAvailable.value = false
  fetchRooms()
}

// Toggle facility selection
const toggleFacility = (facility) => {
  const index = selectedFacilities.value.indexOf(facility)
  if (index === -1) {
    selectedFacilities.value.push(facility)
  } else {
    selectedFacilities.value.splice(index, 1)
  }
}

// Delete room function
const handleDeleteRoom = async (roomId) => {
  if (!confirm('Ești sigur că vrei să ștergi această sală?')) {
    return
  }
  
  try {
    await deleteRoom(roomId)
    toast.success({ 
      title: 'Succes', 
      message: 'Sala a fost ștearsă cu succes',
      position: 'bottomRight'
    })
    // Remove from list without refetching
    rooms.value = rooms.value.filter(r => r._id !== roomId)
  } catch (error) {
    console.error('Error deleting room:', error)
    toast.error({ 
      title: 'Eroare', 
      message: error.message || 'Nu s-a putut șterge sala',
      position: 'bottomRight'
    })
  }
}

// Handle key down event for buttons
const handleKeyDown = (event) => {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault()
    event.target.click()
  }
}

// Fetch rooms on mount
onMounted(() => {
  fetchRooms()
})

// Handle search submit
const handleSearchSubmit = () => {
  applyFilters()
}
</script>

<template>
  <div class="px-4 sm:px-6 lg:px-8">
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-3xl font-bold text-gray-900">Săli</h1>
      <NuxtLink 
        v-if="isAdmin"
        to="/rooms/create" 
        class="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-md font-medium transition inline-flex items-center"
      >
        Adaugă Sală Nouă
      </NuxtLink>
    </div>
    
    <!-- Search and Filter -->
    <div class="bg-white rounded-lg shadow-md p-4 mb-6">
      <div class="mb-4">
        <div class="relative">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Caută săli după nume, locație sau descriere"
            class="w-full px-4 py-2 pl-10 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition"
            @keydown.enter="handleSearchSubmit"
          />
          <div class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
      </div>
      
      <div class="flex flex-wrap gap-4">
        <!-- Capacity Filter -->
        <div class="w-full md:w-48">
          <label for="capacity" class="block text-sm font-medium text-gray-700 mb-1">Capacitate Minimă</label>
          <input
            id="capacity"
            v-model="minCapacity"
            type="number"
            min="1"
            placeholder="Capacitate minimă"
            class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition"
          />
        </div>
        
        <!-- Availability Filter -->
        <div class="w-full md:w-auto flex items-center">
          <div class="ml-1 mt-6">
            <label class="inline-flex items-center cursor-pointer">
              <input
                v-model="showOnlyAvailable"
                type="checkbox"
                class="h-4 w-4 text-orange-500 focus:ring-orange-500 border-gray-300 rounded"
              />
              <span class="ml-2 text-sm text-gray-700">Doar sălile disponibile</span>
            </label>
          </div>
        </div>
        
        <!-- Filter Buttons -->
        <div class="flex items-end ml-auto gap-2">
          <button
            @click="applyFilters"
            class="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-md font-medium transition"
          >
            Aplică Filtrele
          </button>
          <button
            @click="resetFilters"
            class="border border-gray-300 text-gray-700 px-4 py-2 rounded-md font-medium hover:bg-gray-100 transition"
          >
            Resetează
          </button>
        </div>
      </div>
      
      <!-- Facilities Filter -->
      <div class="mt-4">
        <label class="block text-sm font-medium text-gray-700 mb-2">Facilități</label>
        <div class="flex flex-wrap gap-2">
          <button
            v-for="facility in facilitiesList"
            :key="facility"
            @click="toggleFacility(facility)"
            class="px-3 py-1 rounded-full text-sm font-medium transition"
            :class="selectedFacilities.includes(facility) 
              ? 'bg-orange-500 text-white' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'"
          >
            {{ facility }}
          </button>
        </div>
      </div>
    </div>
    
    <!-- Loading State -->
    <div v-if="isLoading" class="flex justify-center my-12">
      <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
    </div>
    
    <!-- Error State -->
    <div v-else-if="error" class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
      {{ error }}
    </div>
    
    <!-- Empty State -->
    <div v-else-if="rooms.length === 0" class="text-center py-12">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
      </svg>
      <h3 class="text-lg font-medium text-gray-900 mb-2">Nu s-au găsit săli</h3>
      <p class="text-gray-600">Nicio sală nu corespunde criteriilor de căutare. Încearcă să ajustezi filtrele.</p>
    </div>
    
    <!-- Room List -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div 
        v-for="room in rooms" 
        :key="room._id" 
        class="bg-white rounded-lg shadow-md overflow-hidden transition-transform hover:translate-y-[-4px]"
      >
        <div class="h-48 bg-gray-200 relative">
          <img 
            :src="room.image" 
            :alt="room.name" 
            class="w-full h-full object-cover"
            @error="$event.target.src = '/images/default-room.jpg'"
          />
          <div 
            v-if="!room.isAvailable" 
            class="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded-md"
          >
            Indisponibilă
          </div>
        </div>
        
        <div class="p-4">
          <div class="flex justify-between items-start">
            <h2 class="text-xl font-semibold text-gray-900 mb-1">{{ room.name }}</h2>
            <span class="text-sm bg-gray-100 text-gray-700 px-2 py-1 rounded-md">
              Capacitate: {{ room.capacity }}
            </span>
          </div>
          
          <p class="text-gray-600 text-sm mb-3">{{ room.location }}</p>
          
          <div class="flex flex-wrap gap-1 mb-4">
            <span 
              v-for="facility in room.facilities" 
              :key="facility"
              class="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded-full"
            >
              {{ facility }}
            </span>
          </div>
          
          <div class="flex justify-between mt-auto pt-2 border-t border-gray-100">
            <NuxtLink 
              :to="`/rooms/${room._id}`"
              class="text-orange-500 hover:text-orange-600 font-medium text-sm"
            >
              Vezi Detalii
            </NuxtLink>
            
            <div v-if="isAdmin" class="flex space-x-2">
              <NuxtLink 
                :to="`/rooms/edit/${room._id}`"
                class="bg-blue-100 hover:bg-blue-200 text-blue-700 text-sm px-2 py-1 rounded flex items-center"
                tabindex="0"
                aria-label="Edit room"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Editează
              </NuxtLink>
              
              <button 
                class="bg-red-100 hover:bg-red-200 text-red-700 text-sm px-2 py-1 rounded flex items-center"
                @click="handleDeleteRoom(room._id)"
                @keydown="handleKeyDown"
                tabindex="0"
                aria-label="Delete room"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Șterge
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template> 