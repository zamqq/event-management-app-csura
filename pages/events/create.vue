<script setup>
const route = useRoute()
const router = useRouter()
const toast = useToast()

// Use the event conflicts composable
const { conflictError, isCheckingConflicts, debouncedConflictCheck } = useEventConflicts()

// State management
const eventData = ref({
  name: '',
  room: '',
  resources: [],
  eventDate: '',
  startTime: '',
  endTime: '',
  description: '',
  attendees: 0
})

// Validation
const errors = ref({})
const serverError = ref('')
const isLoading = ref(false)

// Get room id from query params if available
onMounted(() => {
  if (route.query.roomId) {
    eventData.value.room = route.query.roomId
    fetchRoomDetails(route.query.roomId)
  }
  fetchRooms()
  fetchResources()
})

// Room data
const rooms = ref([])
const selectedRoom = ref(null)
const isLoadingRooms = ref(true)
const roomError = ref('')

// Resources list
const resourcesList = [
  'Pens',
  'Paper',
  'Banners',
  'Chairs',
  'Tables',
  'Other'
]

// Add this to the imports/data section
const allResources = ref([])
const isLoadingResources = ref(true)
const resourceError = ref('')

// Fetch available rooms
const fetchRooms = async () => {
  try {
    isLoadingRooms.value = true
    roomError.value = '' // Clear previous errors
    
    const response = await fetch('/api/rooms?isAvailable=true')
    
    // Check if response is ok before trying to parse
    if (!response.ok) {
      roomError.value = `Error loading rooms: ${response.status} ${response.statusText}`
      return
    }
    
    try {
      const data = await response.json()
      if (data && data.rooms) {
        rooms.value = data.rooms
      } else {
        roomError.value = 'Invalid response format from server'
        console.error('Invalid rooms response format:', data)
      }
    } catch (parseError) {
      roomError.value = 'Error parsing server response'
      console.error('Error parsing rooms response:', parseError)
    }
  } catch (error) {
    console.error('Error fetching rooms:', error)
    roomError.value = 'Failed to load available rooms'
  } finally {
    isLoadingRooms.value = false
  }
}

// Fetch single room details
const fetchRoomDetails = async (roomId) => {
  try {
    const response = await fetch(`/api/rooms/${roomId}`)
    
    // Check if response is ok before trying to parse
    if (!response.ok) {
      console.error(`Error loading room details: ${response.status} ${response.statusText}`)
      return
    }
    
    try {
      const data = await response.json()
      if (data && data.room) {
        selectedRoom.value = data.room
      } else {
        console.error('Invalid room details response format:', data)
      }
    } catch (parseError) {
      console.error('Error parsing room details response:', parseError)
    }
  } catch (error) {
    console.error('Error fetching room details:', error)
  }
}

// Handle room selection change
const handleRoomChange = async () => {
  if (eventData.value.room) {
    await fetchRoomDetails(eventData.value.room)
  } else {
    selectedRoom.value = null
  }
}

// Fetch resources
const fetchResources = async () => {
  try {
    isLoadingResources.value = true
    resourceError.value = ''
    
    const response = await fetch('/api/resources?isAvailable=true')
    
    if (!response.ok) {
      resourceError.value = `Error loading resources: ${response.status} ${response.statusText}`
      return
    }
    
    const data = await response.json()
    if (data && data.resources) {
      allResources.value = data.resources
    } else {
      resourceError.value = 'Invalid response format from server'
    }
  } catch (error) {
    console.error('Error fetching resources:', error)
    resourceError.value = 'Failed to load available resources'
  } finally {
    isLoadingResources.value = false
  }
}

// Watch for changes in room, date, or time to check conflicts
watch([
  () => eventData.value.room,
  () => eventData.value.eventDate,
  () => eventData.value.startTime,
  () => eventData.value.endTime
], () => {
  debouncedConflictCheck(eventData.value, null, selectedRoom.value)
})

// Form validation
const validateForm = () => {
  const newErrors = {}
  
  if (!eventData.value.name?.trim()) {
    newErrors.name = 'Numele evenimentului este obligatoriu'
  }
  
  if (!eventData.value.room) {
    newErrors.room = 'Te rog să selectezi o sală'
  }
  
  if (!eventData.value.eventDate) {
    newErrors.eventDate = 'Data evenimentului este obligatorie'
  }
  
  if (!eventData.value.startTime) {
    newErrors.startTime = 'Ora de început este obligatorie'
  }
  
  if (!eventData.value.endTime) {
    newErrors.endTime = 'Ora de sfârșit este obligatorie'
  }
  
  if (eventData.value.startTime && eventData.value.endTime && 
      eventData.value.startTime >= eventData.value.endTime) {
    newErrors.endTime = 'Ora de sfârșit trebuie să fie după ora de început'
  }
  
  // Validate attendees against room capacity
  if (eventData.value.attendees && selectedRoom.value) {
    if (eventData.value.attendees > selectedRoom.value.capacity) {
      newErrors.attendees = `Numărul de participanți (${eventData.value.attendees}) depășește capacitatea sălii (${selectedRoom.value.capacity})`
    }
  }
  
  if (eventData.value.resources.some(r => r.resource && r.quantity <= 0)) {
    newErrors.resources = 'Cantitățile de resurse trebuie să fie mai mari decât zero'
  }
  
  // Add conflict validation
  if (conflictError.value) {
    newErrors.conflict = conflictError.value
  }
  
  errors.value = newErrors
  return Object.keys(newErrors).length === 0
}

// Submit form
const handleSubmit = async () => {
  if (!validateForm()) {
    return
  }
  
  try {
    isLoading.value = true
    serverError.value = ''
    
    const response = await fetch('/api/events', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(eventData.value)
    })
    
    // Use status code to determine success - this avoids parsing issues
    if (response.status >= 200 && response.status < 300) {
      // Use the new toast API format with title and message
      toast.success({ 
        title: 'Succes', 
        message: 'Evenimentul a fost creat cu succes!' ,
        position: 'bottomRight',
      })
      
      // Use setTimeout to ensure the toast is shown before navigation
      setTimeout(() => {
        router.push('/events')
      }, 300)
      return
    }
    
    // Only try to parse the response if it's an error
    let errorMessage = `Error: ${response.status}`
    try {
      const errorData = await response.json()
      errorMessage = errorData && errorData.message ? errorData.message : errorMessage
    } catch (e) {
      console.error('Failed to parse error response:', e)
    }
    
    // Show error toast
    toast.error({ 
      title: 'Eroare', 
      message: errorMessage 
    })
    
    serverError.value = errorMessage
  } catch (error) {
    console.error('Network or parsing error:', error)
    const errorMsg = 'A apărut o eroare neașteptată. Te rog să încerci din nou.'
    
    // Show network error toast
    toast.error({ 
      title: 'Eroare de Rețea', 
      message: errorMsg 
    })
    
    serverError.value = errorMsg
  } finally {
    isLoading.value = false
  }
}

// Handle key down event for buttons
const handleKeyDown = (event) => {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault()
    event.target.click()
  }
}

// Calculate min date (today)
const today = new Date().toISOString().split('T')[0]

// Replace the toggleResource function with these functions
const addResource = () => {
  eventData.value.resources.push({
    resource: '',
    quantity: 1
  })
}

const removeResource = (index) => {
  eventData.value.resources.splice(index, 1)
}
</script>

<template>
  <div class="px-4 sm:px-6 lg:px-8">
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-3xl font-bold text-gray-900">Creează Eveniment</h1>
      <NuxtLink 
        to="/events" 
        class="text-orange-500 hover:text-orange-600 font-medium"
      >
        Înapoi la Evenimente
      </NuxtLink>
    </div>
    
    <div class="bg-white rounded-lg shadow-md p-6">
      <!-- Server Error -->
      <div v-if="serverError || roomError" class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
        <div class="flex">
          <div class="flex-shrink-0">
            <svg class="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
            </svg>
          </div>
          <div class="ml-3">
            <p class="text-sm font-medium">{{ serverError || roomError }}</p>
          </div>
        </div>
      </div>
      
      <form @submit.prevent="handleSubmit" class="space-y-6">
        <!-- Event Name -->
        <div>
          <label for="name" class="block text-sm font-medium text-gray-700 mb-1">Numele Evenimentului *</label>
          <input
            id="name"
            v-model="eventData.name"
            type="text"
            placeholder="Introdu numele evenimentului"
            class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition"
            :class="{'border-red-500': errors.name}"
          />
          <p v-if="errors.name" class="mt-1 text-sm text-red-600">{{ errors.name }}</p>
        </div>
        
        <!-- Room Selection -->
        <div>
          <label for="room" class="block text-sm font-medium text-gray-700 mb-1">Selectează Sala *</label>
          <select
            id="room"
            v-model="eventData.room"
            class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition"
            :class="{'border-red-500': errors.room}"
            @change="handleRoomChange"
          >
            <option value="">Selectează o sală</option>
            <option v-for="room in rooms" :key="room._id" :value="room._id">
              {{ room.name }} (Capacitate: {{ room.capacity }})
            </option>
          </select>
          <p v-if="errors.room" class="mt-1 text-sm text-red-600">{{ errors.room }}</p>
          
          <!-- Selected Room Preview -->
          <div v-if="selectedRoom" class="mt-3 p-3 bg-gray-50 rounded-md">
            <div class="flex items-center space-x-3">
              <div class="h-12 w-12 flex-shrink-0 bg-gray-200 rounded overflow-hidden">
                <img 
                  :src="selectedRoom.image" 
                  :alt="selectedRoom.name" 
                  class="h-full w-full object-cover"
                  @error="$event.target.src = '/images/default-room.jpg'"
                />
              </div>
              <div>
                <h3 class="font-medium text-gray-800">{{ selectedRoom.name }}</h3>
                <p class="text-sm text-gray-600">{{ selectedRoom.location }} · Capacitate: {{ selectedRoom.capacity }}</p>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Date and Time -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label for="eventDate" class="block text-sm font-medium text-gray-700 mb-1">Data Evenimentului *</label>
            <input
              id="eventDate"
              v-model="eventData.eventDate"
              type="date"
              :min="today"
              class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition"
              :class="{'border-red-500': errors.eventDate}"
            />
            <p v-if="errors.eventDate" class="mt-1 text-sm text-red-600">{{ errors.eventDate }}</p>
          </div>
          
          <div>
            <label for="startTime" class="block text-sm font-medium text-gray-700 mb-1">Ora de Început *</label>
            <input
              id="startTime"
              v-model="eventData.startTime"
              type="time"
              class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition"
              :class="{'border-red-500': errors.startTime}"
            />
            <p v-if="errors.startTime" class="mt-1 text-sm text-red-600">{{ errors.startTime }}</p>
          </div>
          
          <div>
            <label for="endTime" class="block text-sm font-medium text-gray-700 mb-1">Ora de Sfârșit *</label>
            <input
              id="endTime"
              v-model="eventData.endTime"
              type="time"
              class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition"
              :class="{'border-red-500': errors.endTime}"
            />
            <p v-if="errors.endTime" class="mt-1 text-sm text-red-600">{{ errors.endTime }}</p>
          </div>
        </div>
        
        <!-- Conflict Warning -->
        <div v-if="conflictError || isCheckingConflicts" class="rounded-md p-4" :class="conflictError ? 'bg-red-50 border border-red-200' : 'bg-yellow-50 border border-yellow-200'">
          <div class="flex">
            <div class="flex-shrink-0">
              <svg v-if="conflictError" class="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
              </svg>
              <svg v-else class="h-5 w-5 text-yellow-400 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
            <div class="ml-3">
              <p class="text-sm font-medium" :class="conflictError ? 'text-red-800' : 'text-yellow-800'">
                {{ conflictError || 'Se verifică conflictele de programare...' }}
              </p>
            </div>
          </div>
        </div>
        
        <!-- Attendees -->
        <div>
          <label for="attendees" class="block text-sm font-medium text-gray-700 mb-1">
            Participanți Așteptați
            <span v-if="selectedRoom" class="text-sm text-gray-500 font-normal">
              (Capacitate sală: {{ selectedRoom.capacity }})
            </span>
          </label>
          <input
            id="attendees"
            v-model.number="eventData.attendees"
            type="number"
            min="0"
            :max="selectedRoom ? selectedRoom.capacity : undefined"
            placeholder="Numărul de participanți"
            class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition"
            :class="{'border-red-500': errors.attendees}"
          />
          <p v-if="errors.attendees" class="mt-1 text-sm text-red-600">{{ errors.attendees }}</p>
          <p v-else-if="selectedRoom" class="mt-1 text-xs text-gray-500">
            Numărul maxim de participanți pentru această sală este {{ selectedRoom.capacity }}
          </p>
        </div>
        
        <!-- Description -->
        <div>
          <label for="description" class="block text-sm font-medium text-gray-700 mb-1">Descriere</label>
          <textarea
            id="description"
            v-model="eventData.description"
            rows="3"
            placeholder="Introdu descrierea evenimentului"
            class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition"
          ></textarea>
        </div>
        
        <!-- Resources -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Resurse Necesare</label>
          
          <!-- Resource Error -->
          <div v-if="resourceError" class="mb-3 text-sm text-red-600">
            {{ resourceError }}
          </div>
          
          <!-- Resources List -->
          <div v-if="eventData.resources.length > 0" class="space-y-3 mb-3">
            <div 
              v-for="(resourceItem, index) in eventData.resources" 
              :key="index"
              class="flex items-center space-x-3 p-3 bg-gray-50 rounded-md"
            >
              <div class="flex-grow">
                <select
                  v-model="resourceItem.resource"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition text-sm"
                >
                  <option value="">Selectează o resursă</option>
                  <option v-for="resource in allResources" :key="resource._id" :value="resource._id">
                    {{ resource.name }} (Disponibile: {{ resource.availableQuantity }})
                  </option>
                </select>
              </div>
              
              <div class="w-24">
                <input
                  v-model.number="resourceItem.quantity"
                  type="number"
                  min="1"
                  :max="resourceItem.resource ? (allResources.find(r => r._id === resourceItem.resource)?.availableQuantity || 1) : 1"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition text-sm"
                />
              </div>
              
              <button
                type="button"
                @click="removeResource(index)"
                @keydown="handleKeyDown"
                class="text-red-500 hover:text-red-600"
                tabindex="0"
                aria-label="Remove resource"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
            
            <p v-if="errors.resources" class="mt-1 text-sm text-red-600">{{ errors.resources }}</p>
          </div>
          
          <!-- Add Resource Button -->
          <button
            type="button"
            @click="addResource"
            @keydown="handleKeyDown"
            class="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
            tabindex="0"
            aria-label="Add resource"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="-ml-1 mr-2 h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Adaugă Resursă
          </button>
          
          <!-- Resource Selection Loading Indicator -->
          <div v-if="isLoadingResources" class="mt-2 flex items-center text-sm text-gray-500">
            <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Se încarcă resursele...
          </div>
        </div>
        
        <!-- Submit Button -->
        <div class="pt-4">
          <button
            type="submit"
            class="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-md font-medium transition"
            :class="{'opacity-70 cursor-not-allowed': isLoading}"
            :disabled="isLoading"
            tabindex="0"
            aria-label="Create event"
          >
            <span v-if="isLoading">Se creează evenimentul...</span>
            <span v-else>Creează Eveniment</span>
          </button>
        </div>
      </form>
    </div>
  </div>
</template> 