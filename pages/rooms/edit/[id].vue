<script setup>
import { ref, onMounted, computed } from 'vue'

const route = useRoute()
const router = useRouter()
const roomId = route.params.id

definePageMeta({
  layout: 'default',
  requiresAuth: true
})

const { fetchRoomById, updateRoom, isLoading, error: roomError } = useRooms()
const { isAuthenticated, user } = useAuth()

// Check if user is admin
if (process.client) {
  if (!isAuthenticated.value || user.value?.role !== 'admin') {
    router.push('/rooms')
  }
}

// Form data
const roomData = ref({
  name: '',
  capacity: null,
  location: '',
  description: '',
  facilities: [],
  isAvailable: true,
  image: '/images/default-room.jpg'
})

// Validation errors
const errors = ref({})
const serverError = ref('')

// Facilities list
const facilitiesList = [
  'Videoproiector',
  'Tabla Alba',
  'Calculator',
  'Sistem Audio',
  'Aer Conditionat',
  'Tabla Digitala',
  'Altele'
]

// Toggle facility selection
const toggleFacility = (facility) => {
  const index = roomData.value.facilities.indexOf(facility)
  if (index === -1) {
    roomData.value.facilities.push(facility)
  } else {
    roomData.value.facilities.splice(index, 1)
  }
}

// Validate form
const validateForm = () => {
  const newErrors = {}
  
  if (!roomData.value.name) {
    newErrors.name = 'Numele sălii este obligatoriu'
  }
  
  if (!roomData.value.capacity) {
    newErrors.capacity = 'Capacitatea este obligatorie'
  } else if (roomData.value.capacity < 1) {
    newErrors.capacity = 'Capacitatea trebuie să fie cel puțin 1'
  }
  
  if (!roomData.value.location) {
    newErrors.location = 'Locația este obligatorie'
  }
  
  errors.value = newErrors
  return Object.keys(newErrors).length === 0
}

// Submit form
const handleSubmit = async () => {
  if (!validateForm()) return
  
  serverError.value = ''
  
  try {
    // Update room
    await updateRoom(roomId, roomData.value)
    
    // Navigate to room detail
    router.push(`/rooms/${roomId}`)
  } catch (err) {
    serverError.value = err.message || 'Nu s-a putut actualiza sala'
  }
}

// Fetch room data on mount
onMounted(async () => {
  try {
    const room = await fetchRoomById(roomId)
    
    // Populate form with room data
    if (room) {
      roomData.value = { ...room }
      // Ensure facilities is an array
      if (!Array.isArray(roomData.value.facilities)) {
        roomData.value.facilities = []
      }
    }
  } catch (err) {
    serverError.value = 'Nu s-au putut încărca datele sălii'
    console.error('Failed to fetch room:', err)
  }
})
</script>

<template>
  <div class="container mx-auto px-4 py-8">
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-3xl font-bold text-gray-900">Editează Sala</h1>
      <NuxtLink 
        :to="`/rooms/${roomId}`" 
        class="text-orange-500 hover:text-orange-600 font-medium"
      >
        Anulează
      </NuxtLink>
    </div>
    
    <div class="bg-white rounded-lg shadow-md p-6">
      <!-- Server Error -->
      <div v-if="serverError || roomError" class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
        {{ serverError || roomError }}
      </div>
      
      <!-- Loading State -->
      <div v-if="isLoading" class="flex justify-center my-12">
        <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
      </div>
      
      <form v-else @submit.prevent="handleSubmit" class="space-y-6">
        <!-- Room Name -->
        <div>
          <label for="name" class="block text-sm font-medium text-gray-700 mb-1">Numele Sălii *</label>
          <input
            id="name"
            v-model="roomData.name"
            type="text"
            placeholder="Introdu numele sălii"
            class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition"
            :class="{'border-red-500': errors.name}"
          />
          <p v-if="errors.name" class="mt-1 text-sm text-red-600">{{ errors.name }}</p>
        </div>
        
        <!-- Capacity -->
        <div>
          <label for="capacity" class="block text-sm font-medium text-gray-700 mb-1">Capacitate *</label>
          <input
            id="capacity"
            v-model.number="roomData.capacity"
            type="number"
            min="1"
            placeholder="Introdu capacitatea sălii"
            class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition"
            :class="{'border-red-500': errors.capacity}"
          />
          <p v-if="errors.capacity" class="mt-1 text-sm text-red-600">{{ errors.capacity }}</p>
        </div>
        
        <!-- Location -->
        <div>
          <label for="location" class="block text-sm font-medium text-gray-700 mb-1">Locație *</label>
          <input
            id="location"
            v-model="roomData.location"
            type="text"
            placeholder="Introdu locația sălii"
            class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition"
            :class="{'border-red-500': errors.location}"
          />
          <p v-if="errors.location" class="mt-1 text-sm text-red-600">{{ errors.location }}</p>
        </div>
        
        <!-- Description -->
        <div>
          <label for="description" class="block text-sm font-medium text-gray-700 mb-1">Descriere</label>
          <textarea
            id="description"
            v-model="roomData.description"
            rows="4"
            placeholder="Introdu descrierea sălii"
            class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition"
          ></textarea>
        </div>
        
        <!-- Image URL -->
        <div>
          <label for="image" class="block text-sm font-medium text-gray-700 mb-1">URL Imagine</label>
          <input
            id="image"
            v-model="roomData.image"
            type="text"
            placeholder="Introdu URL-ul imaginii (lasă gol pentru imaginea implicită)"
            class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition"
          />
          <p class="mt-1 text-xs text-gray-500">Lasă gol pentru a folosi imaginea implicită</p>
          
          <!-- Image Preview -->
          <div v-if="roomData.image" class="mt-2 flex justify-center">
            <img 
              :src="roomData.image" 
              alt="Previzualizare sală" 
              class="h-40 w-auto object-cover rounded-md border border-gray-200"
              @error="roomData.image = '/images/default-room.jpg'"
            />
          </div>
        </div>
        
        <!-- Facilities -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Facilități</label>
          <div class="flex flex-wrap gap-2">
            <button
              type="button"
              v-for="facility in facilitiesList"
              :key="facility"
              @click="toggleFacility(facility)"
              class="px-3 py-1 rounded-full text-sm font-medium transition"
              :class="roomData.facilities.includes(facility) 
                ? 'bg-orange-500 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'"
            >
              {{ facility }}
            </button>
          </div>
        </div>
        
        <!-- Availability -->
        <div>
          <div class="flex items-center">
            <input
              id="isAvailable"
              v-model="roomData.isAvailable"
              type="checkbox"
              class="h-4 w-4 text-orange-500 focus:ring-orange-500 border-gray-300 rounded"
            />
            <label for="isAvailable" class="ml-2 block text-sm text-gray-700">Sala este disponibilă pentru rezervare</label>
          </div>
        </div>
        
        <!-- Submit Button -->
        <div class="pt-4">
          <button
            type="submit"
            class="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-md font-medium transition"
            :class="{'opacity-70 cursor-not-allowed': isLoading}"
            :disabled="isLoading"
          >
            <span v-if="isLoading">Se actualizează sala...</span>
            <span v-else>Actualizează Sala</span>
          </button>
        </div>
      </form>
    </div>
  </div>
</template> 