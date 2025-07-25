<script setup>
import { onMounted } from 'vue'

const route = useRoute()
const router = useRouter()
const roomId = route.params.id

definePageMeta({
  layout: 'default'
})

const { currentRoom, isLoading, error, fetchRoomById, deleteRoom } = useRooms()
const { isAuthenticated, user } = useAuth()
const toast = useToast()

// Admin check
const isAdmin = computed(() => {
  return isAuthenticated.value && user.value && user.value.role === 'admin'
})

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
    // Navigate back to rooms list
    router.push('/rooms')
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

// Fetch room on mount
onMounted(async () => {
  try {
    await fetchRoomById(roomId)
  } catch (err) {
    console.error('Failed to fetch room:', err)
  }
})
</script>

<template>
  <div class="px-4 sm:px-6 lg:px-8">
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-3xl font-bold text-gray-900">Detalii Sală</h1>
      <NuxtLink 
        to="/rooms" 
        class="text-orange-500 hover:text-orange-600 font-medium"
      >
        Înapoi la Săli
      </NuxtLink>
    </div>
    
    <!-- Loading State -->
    <div v-if="isLoading" class="flex justify-center my-12">
      <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
    </div>
    
    <!-- Error State -->
    <div v-else-if="error" class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
      {{ error }}
    </div>
    
    <!-- Room Details -->
    <div v-else-if="currentRoom" class="bg-white rounded-lg shadow-md overflow-hidden">
      <!-- Admin Action Buttons -->
      <div v-if="isAdmin" class="bg-gray-100 px-6 py-3 flex justify-end space-x-4">
        <NuxtLink 
          :to="`/rooms/edit/${currentRoom._id}`"
          class="text-blue-500 hover:text-blue-600 font-medium inline-flex items-center"
          tabindex="0"
          aria-label="Edit room"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          Editează Sala
        </NuxtLink>
        
        <button 
          class="text-red-500 hover:text-red-600 font-medium inline-flex items-center"
          @click="handleDeleteRoom(currentRoom._id)"
          @keydown="handleKeyDown"
          tabindex="0"
          aria-label="Delete room"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          Șterge Sala
        </button>
      </div>
      
      <!-- Room Image -->
      <div class="relative">
        <img 
          :src="currentRoom.image" 
          :alt="currentRoom.name" 
          class="w-full h-64 md:h-96 object-cover"
          @error="$event.target.src = '/images/default-room.jpg'"
        />
        <div 
          v-if="!currentRoom.isAvailable" 
          class="absolute top-4 right-4 bg-red-500 text-white px-3 py-1 rounded-md font-medium"
        >
          Indisponibilă
        </div>
      </div>
      
      <!-- Room Info -->
      <div class="p-6">
        <div class="flex flex-wrap justify-between items-start mb-4">
          <div>
            <h1 class="text-3xl font-bold text-gray-900 mb-2">{{ currentRoom.name }}</h1>
            <p class="text-lg text-gray-600">{{ currentRoom.location }}</p>
          </div>
          
          <div class="bg-gray-100 text-gray-800 px-4 py-2 rounded-md text-lg font-medium">
            Capacitate: {{ currentRoom.capacity }}
          </div>
        </div>
        
        <div class="border-t border-gray-200 pt-6 pb-4">
          <h2 class="text-xl font-semibold text-gray-900 mb-4">Descriere</h2>
          <p class="text-gray-700 mb-6">{{ currentRoom.description || 'Nu există descriere disponibilă.' }}</p>
          
          <h2 class="text-xl font-semibold text-gray-900 mb-4">Facilități</h2>
          <div class="flex flex-wrap gap-2 mb-6">
            <span 
              v-for="facility in currentRoom.facilities" 
              :key="facility"
              class="bg-gray-100 text-gray-700 px-3 py-1 rounded-full"
            >
              {{ facility }}
            </span>
            <span v-if="!currentRoom.facilities || currentRoom.facilities.length === 0" class="text-gray-500">
              Nu sunt listate facilități.
            </span>
          </div>
        </div>
        
        <!-- Create Event Button -->
        <div class="border-t border-gray-200 pt-6">
          <NuxtLink 
            :to="`/events/create?roomId=${currentRoom._id}`"
            class="block w-full bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-md font-medium text-center transition disabled:opacity-50 disabled:cursor-not-allowed"
            :class="{ 'opacity-50 cursor-not-allowed': !currentRoom.isAvailable }"
            :disabled="!currentRoom.isAvailable"
          >
            {{ currentRoom.isAvailable ? 'Creează Eveniment în Această Sală' : 'Sala Nu Este Disponibilă' }}
          </NuxtLink>
        </div>
      </div>
    </div>
    
    <!-- Not Found -->
    <div v-else class="text-center py-12">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <h3 class="text-lg font-medium text-gray-900 mb-2">Sala Nu A Fost Găsită</h3>
      <p class="text-gray-600 mb-6">Sala pe care o cauți nu există sau a fost eliminată.</p>
      <NuxtLink 
        to="/rooms" 
        class="inline-block bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-md font-medium transition"
      >
        Vezi Toate Sălile
      </NuxtLink>
    </div>
  </div>
</template> 