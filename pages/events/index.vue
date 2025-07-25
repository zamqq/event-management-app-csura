<script setup>
const router = useRouter()
const toast = useToast()

// State management
const events = ref([])
const isLoading = ref(true)
const error = ref('')

// User authentication
const { data: authUser } = useFetch('/api/auth/me')
const isAdmin = computed(() => authUser.value?.user?.role === 'admin')

// For debugging
const canEditEvent = (event) => {
  if (isAdmin.value) return true
  if (!authUser.value?.user || !event.organizer) return false
  
  // For populated organizer object
  if (event.organizer._id) {
    return authUser.value.user.id === event.organizer._id
  }
  
  // For non-populated organizer (just ID)
  return authUser.value.user.id === event.organizer
}

// Filters
const showMyEvents = ref(false)
const statusFilter = ref('')
const dateFilter = ref('')
const searchQuery = ref('')

// Fetch events
const fetchEvents = async () => {
  try {
    isLoading.value = true
    error.value = ''
    
    // Build query params based on filters
    let queryParams = new URLSearchParams()
    
    // Handle "My Events" from either checkbox or URL parameter
    const urlParams = new URLSearchParams(window.location.search)
    const urlOrganizerId = urlParams.get('organizerId')
    
    if ((showMyEvents.value && authUser.value) || (urlOrganizerId === 'current' && authUser.value)) {
      queryParams.append('organizerId', authUser.value.user.id)
      // If coming from URL parameter, set the checkbox too
      if (urlOrganizerId === 'current') {
        showMyEvents.value = true
      }
    }
    
    if (statusFilter.value) {
      queryParams.append('status', statusFilter.value)
    }
    
    if (dateFilter.value) {
      queryParams.append('fromDate', dateFilter.value)
    }
    
    if (searchQuery.value.trim()) {
      queryParams.append('search', searchQuery.value.trim())
    }
    
    const query = queryParams.toString() ? `?${queryParams.toString()}` : ''
    const response = await fetch(`/api/events${query}`)
    const data = await response.json()
    
    if (data.success) {
      events.value = data.events
    } else {
      error.value = data.message || 'Nu s-a putut încărca evenimentele'
    }
  } catch (error) {
    console.error('Error fetching events:', error)
    error.value = 'A apărut o eroare neașteptată'
  } finally {
    isLoading.value = false
  }
}

// Apply filters
const applyFilters = () => {
  fetchEvents()
}

// Reset filters
const resetFilters = () => {
  showMyEvents.value = false
  statusFilter.value = ''
  dateFilter.value = ''
  searchQuery.value = ''
  fetchEvents()
}

// Format date
const formatDate = (dateString) => {
  const options = { year: 'numeric', month: 'short', day: 'numeric' }
  return new Date(dateString).toLocaleDateString('ro-RO', options)
}

// Delete event
const deleteEvent = async (eventId) => {
  if (!confirm('Ești sigur că vrei să ștergi acest eveniment?')) {
    return
  }
  
  try {
    const response = await fetch(`/api/events/${eventId}`, {
      method: 'DELETE'
    })
    
    const data = await response.json()
    
    if (data.success) {
      toast.success({ 
        title: 'Succes', 
        message: 'Evenimentul a fost șters cu succes',
        position: 'bottomRight'
      })
      // Remove from list without refetching
      events.value = events.value.filter(event => event._id !== eventId)
    } else {
      toast.error({ 
        title: 'Eroare', 
        message: data.message || 'Nu s-a putut șterge evenimentul',
        position: 'bottomRight'
      })
    }
  } catch (error) {
    console.error('Error deleting event:', error)
    toast.error({ 
      title: 'Eroare', 
      message: 'A apărut o eroare neașteptată',
      position: 'bottomRight'
    })
  }
}

// Get status badge color
const getStatusColor = (status) => {
  switch (status) {
    case 'approved':
      return 'bg-green-100 text-green-800'
    case 'pending':
      return 'bg-yellow-100 text-yellow-800'
    case 'rejected':
      return 'bg-red-100 text-red-800'
    case 'cancelled':
      return 'bg-gray-100 text-gray-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

// Format time
const formatTime = (timeString) => {
  if (!timeString) return ''
  
  try {
    const [hours, minutes] = timeString.split(':')
    const time = new Date()
    time.setHours(hours)
    time.setMinutes(minutes)
    
    return time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
  } catch (error) {
    return timeString
  }
}

// Initial fetch
onMounted(() => {
  fetchEvents()
})

// Handle key down event for buttons
const handleKeyDown = (event) => {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault()
    event.target.click()
  }
}

// Handle search submit
const handleSearchSubmit = () => {
  applyFilters()
}
</script>

<template>
  <div class="px-4 sm:px-6 lg:px-8">
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-3xl font-bold text-gray-900">Evenimente</h1>
      <NuxtLink 
        to="/events/create" 
        class="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-md font-medium transition inline-flex items-center"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clip-rule="evenodd" />
        </svg>
        Creează Eveniment
      </NuxtLink>
    </div>
    
    <!-- Search and Filters -->
    <div class="bg-white rounded-lg shadow-sm p-4 mb-6">
      
      <!-- Search Bar -->
      <div class="mb-4">
        <div class="relative">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Caută evenimente după nume sau descriere"
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
      
      <div class="flex flex-wrap gap-4 items-end">
        
        <!-- Status Filter -->
        <div class="w-full md:w-auto">
          <label for="status" class="block text-sm font-medium text-gray-700 mb-1">Status</label>
          <select
          id="status"
          v-model="statusFilter"
          class="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition"
          >
          <option value="">Toate Statusurile</option>
          <option value="pending">În Așteptare</option>
          <option value="approved">Aprobat</option>
          <option value="rejected">Respins</option>
          <option value="cancelled">Anulat</option>
        </select>
      </div>
      
      <!-- Date Filter -->
      <div class="w-full md:w-auto">
        <label for="date" class="block text-sm font-medium text-gray-700 mb-1">De la Data</label>
        <input
        id="date"
        v-model="dateFilter"
        type="date"
        class="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition"
        />
      </div>
      
      <!-- My Events Filter -->
      <div v-if="authUser" class="w-full md:w-auto flex items-center mb-3">
        <label class="inline-flex items-center cursor-pointer">
          <input
            v-model="showMyEvents"
            type="checkbox"
            class="h-4 w-4 text-orange-500 focus:ring-orange-500 border-gray-300 rounded"
          />
          <span class="ml-2 text-sm text-gray-700">Afișează doar evenimentele mele</span>
        </label>
      </div>

        <!-- Filter Buttons -->
        <div class="flex items-end ml-auto gap-2">
          <button
            @click="applyFilters"
            @keydown="handleKeyDown"
            class="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-md font-medium transition"
            tabindex="0"
            aria-label="Apply filters"
          >
            Aplică Filtrele
          </button>
          <button
            @click="resetFilters"
            @keydown="handleKeyDown"
            class="border border-gray-300 text-gray-700 px-4 py-2 rounded-md font-medium hover:bg-gray-100 transition"
            tabindex="0"
            aria-label="Reset filters"
          >
            Resetează
          </button>
        </div>
      </div>
    </div>
    
    <!-- Loading State -->
    <div v-if="isLoading" class="flex justify-center py-12">
      <div class="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-orange-500"></div>
    </div>
    
    <!-- Error Message -->
    <div v-else-if="error" class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
      {{ error }}
    </div>
    
    <!-- Empty State -->
    <div v-else-if="events.length === 0" class="bg-white rounded-lg shadow-md p-12 text-center">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
      <h2 class="text-xl font-medium text-gray-800 mb-2">Nu s-au găsit evenimente</h2>
      <p class="text-gray-600 mb-6">Nu există evenimente care să corespundă criteriilor tale.</p>
      <NuxtLink 
        to="/events/create" 
        class="inline-flex items-center bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-md font-medium transition"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clip-rule="evenodd" />
        </svg>
        Creează Primul Tău Eveniment
      </NuxtLink>
    </div>
    
    <!-- Events List -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div 
        v-for="event in events" 
        :key="event._id" 
        class="bg-white rounded-lg shadow-md overflow-hidden transition-transform hover:translate-y-[-4px]"
      >
        <!-- Room Image -->
        <div class="h-40 bg-gray-200 relative">
          <img 
            :src="event.room?.image" 
            :alt="event.room?.name" 
            class="w-full h-full object-cover"
            @error="$event.target.src = '/images/default-room.jpg'"
          />
          <div 
            class="absolute top-2 right-2 text-xs px-2 py-1 rounded-md font-medium"
            :class="getStatusColor(event.status)"
          >
            {{ event.status ? (event.status === 'approved' ? 'Aprobat' : event.status === 'pending' ? 'În Așteptare' : event.status === 'rejected' ? 'Respins' : event.status === 'cancelled' ? 'Anulat' : event.status.charAt(0).toUpperCase() + event.status.slice(1)) : 'Necunoscut' }}
          </div>
        </div>
        
        <div class="p-4">
          <!-- Event Name and Date -->
          <div class="mb-2">
            <h2 class="text-xl font-semibold text-gray-900">{{ event.name }}</h2>
            <div class="flex items-center text-gray-600 text-sm mt-1">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {{ formatDate(event.eventDate) }}
            </div>
            <div class="flex items-center text-gray-600 text-sm mt-1">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {{ formatTime(event.startTime) }} - {{ formatTime(event.endTime) }}
            </div>
          </div>
          
          <!-- Room Info -->
          <div class="flex items-start mb-3">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-500 mt-0.5 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <div>
              <p class="font-medium text-gray-700">{{ event.room?.name }}</p>
              <p class="text-sm text-gray-600">{{ event.room?.location }}</p>
            </div>
          </div>
          
          <!-- Resources -->
          <div v-if="event.resources && event.resources.length > 0" class="mb-3">
            <p class="text-sm font-medium text-gray-700 mb-1">Resurse:</p>
            <div class="flex flex-wrap gap-1">
              <span 
                v-for="resource in event.resources" 
                :key="resource._id"
                class="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded-full"
              >
                {{ resource.resource?.name || 'Unknown Resource' }} x {{ resource.quantity }}
              </span>
            </div>
          </div>
          
          <!-- Attendees -->
          <div v-if="event.attendees > 0" class="flex items-center text-gray-600 text-sm mb-3">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            {{ event.attendees }} Participanți
          </div>
          
          <!-- Actions -->
          <div class="flex justify-between pt-2 border-t border-gray-100">
            <NuxtLink 
              :to="`/events/${event._id}`"
              class="text-orange-500 hover:text-orange-600 font-medium text-sm"
            >
              Vezi Detalii
            </NuxtLink>
            
            <!-- Admin actions - only visible to admins or event organizers -->
            <div v-if="isAdmin || canEditEvent(event)" class="flex space-x-3">
              <NuxtLink 
                :to="`/events/edit/${event._id}`"
                class="bg-blue-100 hover:bg-blue-200 text-blue-700 text-sm px-2 py-1 rounded flex items-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Editează
              </NuxtLink>
              
              <button 
                class="bg-red-100 hover:bg-red-200 text-red-700 text-sm px-2 py-1 rounded flex items-center"
                @click="deleteEvent(event._id)"
                @keydown="handleKeyDown"
                tabindex="0"
                aria-label="Delete event"
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