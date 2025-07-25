<script setup>
// Define page meta - no middleware needed since global auth handles it
definePageMeta({
  layout: 'default'
})

const route = useRoute()
const router = useRouter()
const toast = useToast()

// Use the event conflicts composable
const { conflictError, isCheckingConflicts, debouncedConflictCheck } = useEventConflicts()

// User authentication
const { data: authUser } = useFetch('/api/auth/me', {
  key: `auth-edit-page-${route.params.id}`,
  server: false // Only load on client side to avoid hydration mismatches
})

const isAdmin = computed(() => authUser.value?.user?.role === 'admin')
const isOrganizer = ref(false)
const canEdit = computed(() => isAdmin.value || isOrganizer.value)

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
const isLoadingEvent = ref(true)
const fetchError = ref('')

// Room data
const rooms = ref([])
const selectedRoom = ref(null)
const isLoadingRooms = ref(true)
const roomError = ref('')

// Resources data
const allResources = ref([])
const isLoadingResources = ref(true)
const resourceError = ref('')

// Watch for changes in room, date, or time to check conflicts
watch([
  () => eventData.value.room,
  () => eventData.value.eventDate,
  () => eventData.value.startTime,
  () => eventData.value.endTime
], () => {
  debouncedConflictCheck(eventData.value, route.params.id, selectedRoom.value)
})

// Check if user can edit this event and fetch event data
const fetchEventAndCheckAuth = async () => {
  try {
    isLoadingEvent.value = true
    fetchError.value = ''
    
    const response = await fetch(`/api/events/${route.params.id}`)
    const data = await response.json()
    
    if (!data.success) {
      fetchError.value = data.message || 'Failed to load event'
      return
    }
    
    const event = data.event
    
    // Check authorization
    if (authUser.value?.user) {
      if (authUser.value.user.role === 'admin') {
        // User is admin, allowing edit
      } else if (event.organizer) {
        const organizerId = event.organizer._id || event.organizer
        isOrganizer.value = authUser.value.user.id === organizerId
      }
      
      // If not authorized, redirect back to event page
      if (!isAdmin.value && !isOrganizer.value) {
        toast.error({ 
          title: 'Eroare', 
          message: 'Nu ești autorizat să editezi acest eveniment',
          position: 'bottomRight'
        })
        router.push(`/events/${route.params.id}`)
        return
      }
    } else {
      toast.error({ 
        title: 'Eroare', 
        message: 'Te rog să te autentifici pentru a edita evenimente',
        position: 'bottomRight'
      })
      router.push('/login')
      return
    }
    
    // Transform resources from populated format to form format
    const transformedResources = event.resources ? event.resources.map(resourceItem => ({
      resource: resourceItem.resource?._id || resourceItem.resource || '',
      quantity: resourceItem.quantity || 1
    })) : []
    
    // Populate form data with event details
    eventData.value = {
      name: event.name || '',
      room: event.room?._id || event.room || '',
      resources: transformedResources,
      eventDate: event.eventDate ? new Date(event.eventDate).toISOString().split('T')[0] : '',
      startTime: event.startTime || '',
      endTime: event.endTime || '',
      description: event.description || '',
      attendees: event.attendees || 0
    }
    
    // Fetch room details if available
    if (eventData.value.room) {
      fetchRoomDetails(eventData.value.room)
    }
    
    // After populating event data, fetch and merge used resources
    // This ensures that resources currently used by this event are available in the dropdown
    await fetchAndMergeUsedResources()
  } catch (error) {
    console.error('Error fetching event:', error)
    fetchError.value = 'An unexpected error occurred'
  } finally {
    isLoadingEvent.value = false
  }
}

// Fetch available rooms
const fetchRooms = async () => {
  try {
    isLoadingRooms.value = true
    roomError.value = ''
    
    const response = await fetch('/api/rooms?isAvailable=true')
    
    if (!response.ok) {
      roomError.value = `Eroare la încărcarea sălilor: ${response.status} ${response.statusText}`
      return
    }
    
    const data = await response.json()
    if (data && data.rooms) {
      rooms.value = data.rooms
    } else {
      roomError.value = 'Format de răspuns invalid de la server'
      console.error('Invalid rooms response format:', data)
    }
  } catch (error) {
    console.error('Error fetching rooms:', error)
    roomError.value = 'Nu s-au putut încărca sălile disponibile'
  } finally {
    isLoadingRooms.value = false
  }
}

// Fetch single room details
const fetchRoomDetails = async (roomId) => {
  try {
    const response = await fetch(`/api/rooms/${roomId}`)
    
    if (!response.ok) {
      console.error(`Error loading room details: ${response.status} ${response.statusText}`)
      return
    }
    
    const data = await response.json()
    if (data && data.room) {
      selectedRoom.value = data.room
    } else {
      console.error('Invalid room details response format:', data)
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
      resourceError.value = `Eroare la încărcarea resurselor: ${response.status} ${response.statusText}`
      return
    }
    
    const data = await response.json()
    if (data && data.resources) {
      allResources.value = data.resources
    } else {
      resourceError.value = 'Format de răspuns invalid de la server'
    }
  } catch (error) {
    console.error('Error fetching resources:', error)
    resourceError.value = 'Nu s-au putut încărca resursele disponibile'
  } finally {
    isLoadingResources.value = false
  }
}

// Fetch details for currently used resources and merge with available resources
const fetchAndMergeUsedResources = async () => {
  if (!eventData.value.resources || eventData.value.resources.length === 0) {
    return
  }
  
  try {
    // Get unique resource IDs from the event
    const usedResourceIds = eventData.value.resources
      .map(item => item.resource)
      .filter(id => id) // Remove empty values
    
    if (usedResourceIds.length === 0) {
      return
    }
    
    // Fetch details for each used resource
    const resourcePromises = usedResourceIds.map(async (resourceId) => {
      try {
        const response = await fetch(`/api/resources/${resourceId}`)
        if (response.ok) {
          const data = await response.json()
          return data.resource
        }
        return null
      } catch (error) {
        console.error(`Error fetching resource ${resourceId}:`, error)
        return null
      }
    })
    
    const usedResourceDetails = await Promise.all(resourcePromises)
    const validUsedResources = usedResourceDetails.filter(resource => resource !== null)
    
    // Merge with available resources, avoiding duplicates
    const existingResourceIds = new Set(allResources.value.map(r => r._id))
    const newResources = validUsedResources.filter(resource => !existingResourceIds.has(resource._id))
    
    if (newResources.length > 0) {
      allResources.value = [...allResources.value, ...newResources]
    }
  } catch (error) {
    console.error('Error fetching used resource details:', error)
  }
}

// Replace the toggleResource function with these functions
const addResource = () => {
  if (!eventData.value.resources) {
    eventData.value.resources = []
  }
  
  eventData.value.resources.push({
    resource: '',
    quantity: 1
  })
}

const removeResource = (index) => {
  eventData.value.resources.splice(index, 1)
}

// Update validation function to handle resources and conflicts
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
  
  if (eventData.value.resources && eventData.value.resources.some(r => r.resource && r.quantity <= 0)) {
    newErrors.resources = 'Cantitățile de resurse trebuie să fie mai mari decât zero'
  }
  
  // Add conflict validation
  if (conflictError.value) {
    newErrors.conflict = conflictError.value
  }
  
  errors.value = newErrors
  return Object.keys(newErrors).length === 0
}

// Submit form to update event
const handleSubmit = async () => {
  if (!validateForm()) {
    return
  }
  
  try {
    isLoading.value = true
    serverError.value = ''
    
    const response = await fetch(`/api/events/${route.params.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(eventData.value)
    })
    
    if (response.status >= 200 && response.status < 300) {
      const data = await response.json()
      
      toast.success({ 
        title: 'Succes', 
        message: 'Evenimentul a fost actualizat cu succes!',
        position: 'bottomRight',
      })
      
      // Short timeout to ensure toast is shown before navigation
      setTimeout(() => {
        router.push(`/events/${route.params.id}`)
      }, 300)
      return
    }
    
    // Handle error
    let errorMessage = `Error: ${response.status}`
    try {
      const errorData = await response.json()
      errorMessage = errorData && errorData.message ? errorData.message : errorMessage
    } catch (e) {
      console.error('Failed to parse error response:', e)
    }
    
    console.error('Update failed:', errorMessage)
    toast.error({ 
      title: 'Eroare', 
      message: errorMessage,
      position: 'bottomRight'
    })
    
    serverError.value = errorMessage
  } catch (error) {
    console.error('Network or parsing error:', error)
    const errorMsg = 'A apărut o eroare neașteptată. Te rog să încerci din nou.'
    
    toast.error({ 
      title: 'Eroare de Rețea', 
      message: errorMsg,
      position: 'bottomRight'
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

// Initialize page
onMounted(async () => {
  // Load available resources first
  await fetchResources()
  // Load rooms
  fetchRooms()
  // Then load event data and merge used resources
  await fetchEventAndCheckAuth()
})

// Calculate min date (today)
const today = new Date().toISOString().split('T')[0]
</script>

<template>
  <div class="px-4 sm:px-6 lg:px-8">
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-3xl font-bold text-gray-900">Editează Eveniment</h1>
      <NuxtLink 
        :to="`/events/${route.params.id}`" 
        class="text-orange-500 hover:text-orange-600 font-medium"
      >
        Anulează
      </NuxtLink>
    </div>
    
    <!-- Loading State -->
    <div v-if="isLoadingEvent" class="flex justify-center py-12">
      <div class="flex flex-col items-center">
        <div class="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-orange-500 mb-4"></div>
        <p class="text-gray-600">Se încarcă datele evenimentului...</p>
      </div>
    </div>
    
    <!-- Error Message -->
    <div v-else-if="fetchError" class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
      {{ fetchError }}
      <div class="mt-4">
        <NuxtLink :to="`/events/${route.params.id}`" class="text-red-700 underline">Înapoi la Eveniment</NuxtLink>
      </div>
    </div>
    
    <!-- Form Content -->
    <div v-else class="bg-white rounded-lg shadow-md p-6">
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
          <div v-if="eventData.resources && eventData.resources.length > 0" class="space-y-3 mb-3">
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
                  :max="resourceItem.resource ? (
                    // For existing resources, allow the current quantity plus the available amount
                    resourceItem.resource._id ? 
                      resourceItem.quantity + (allResources.find(r => r._id === resourceItem.resource._id)?.availableQuantity || 0) 
                      : resourceItem.quantity + (allResources.find(r => r._id === resourceItem.resource)?.availableQuantity || 0)
                  ) : 1"
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
            aria-label="Save changes"
          >
            <span v-if="isLoading">Se salvează modificările...</span>
            <span v-else>Salvează Modificările</span>
          </button>
        </div>
      </form>
    </div>
  </div>
</template> 