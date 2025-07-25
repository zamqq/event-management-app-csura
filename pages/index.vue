<script setup>
import { useRouter } from 'vue-router'
import { useAuth } from '~/composables/useAuth'

definePageMeta({
  layout: 'default'
})

const router = useRouter()
const { isAuthenticated } = useAuth()

// State for upcoming events
const upcomingEvents = ref([])
const isLoadingEvents = ref(true)
const eventsError = ref('')

// Fetch upcoming events
const fetchUpcomingEvents = async () => {
  try {
    isLoadingEvents.value = true
    eventsError.value = ''
    
    const response = await fetch('/api/events?limit=6')
    const data = await response.json()
    
    if (data.success) {
      // Filter for upcoming events (today and future) and limit to 6
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      upcomingEvents.value = data.events
        .filter(event => {
          const eventDate = new Date(event.eventDate)
          eventDate.setHours(0, 0, 0, 0)
          return eventDate >= today && event.status === 'approved'
        })
        .slice(0, 6)
    } else {
      eventsError.value = data.message || 'Nu s-au putut încărca evenimentele'
    }
  } catch (error) {
    console.error('Error fetching events:', error)
    eventsError.value = 'A apărut o eroare la încărcarea evenimentelor'
  } finally {
    isLoadingEvents.value = false
  }
}

// Format date for display
const formatEventDate = (dateString) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('ro-RO', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

// Format time for display
const formatEventTime = (timeString) => {
  return timeString.substring(0, 5) // Remove seconds
}

const handleGetStartedClick = () => {
  if (isAuthenticated.value) {
    router.push('/rooms')
  } else {
    router.push('/register')
  }
}

const handleViewRoomsClick = () => {
  router.push('/rooms')
}

const handleViewEventsClick = () => {
  router.push('/events')
}

const handleCreateEventClick = () => {
  router.push('/events/create')
}

const handleKeyDown = (event) => {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault()
    event.target.click()
  }
}

// Fetch events on component mount
onMounted(() => {
  fetchUpcomingEvents()
})
</script>

<template>
  <div>
    <!-- Hero Section -->
    <div class="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-4 sm:px-6 lg:px-8 py-16">
      <div class="max-w-3xl mx-auto text-center">
        <h1 class="text-4xl sm:text-5xl font-bold mb-4">Bun venit la CS-URA</h1>
        <p class="text-xl mb-8">Cea mai ușoară modalitate de a rezerva săli și resurse pentru evenimentele universitare</p>
        <div class="flex flex-wrap justify-center gap-4">
          <NuxtLink 
            to="/rooms" 
            class="bg-white text-orange-600 hover:bg-gray-100 px-6 py-3 rounded-md font-medium shadow-md transition"
          >
            Explorează Sălile
          </NuxtLink>
          <NuxtLink 
            to="/events/create" 
            class="bg-orange-800 text-white hover:bg-orange-900 px-6 py-3 rounded-md font-medium shadow-md transition"
          >
            Creează Eveniment
          </NuxtLink>
        </div>
      </div>
    </div>
    
    <!-- Features Section -->
    <div class="py-16 px-4 sm:px-6 lg:px-8">
          <div class="max-w-6xl mx-auto">
            <h2 class="text-3xl font-bold text-center mb-12">Caracteristici Principale</h2>
            
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              <div class="bg-white p-6 rounded-lg shadow-md text-center">
                <div class="bg-orange-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <h3 class="text-xl font-semibold mb-2">Explorează Săli</h3>
                <p class="text-gray-600">Descoperă și rezervă săli disponibile pentru evenimentele tale. Filtrează după capacitate și locație.</p>
              </div>
              
              <div class="bg-white p-6 rounded-lg shadow-md text-center">
                <div class="bg-orange-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 class="text-xl font-semibold mb-2">Planifică Evenimente</h3>
                <p class="text-gray-600">Creează și organizează evenimente cu ușurință. Selectează sala perfectă și programează-ți activitățile.</p>
              </div>
              
              <div class="bg-white p-6 rounded-lg shadow-md text-center">
                <div class="bg-orange-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10" />
                  </svg>
                </div>
                <h3 class="text-xl font-semibold mb-2">Solicită Resurse</h3>
                <p class="text-gray-600">Adaugă echipamente și resurse necesare pentru evenimentele tale. De la mobilier la tehnologie.</p>
              </div>
              
              <div class="bg-white p-6 rounded-lg shadow-md text-center">
                <div class="bg-orange-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 class="text-xl font-semibold mb-2">Rezervare Simplă</h3>
                <p class="text-gray-600">Proces rapid și intuitiv de rezervare. Verificare automată a conflictelor și confirmare instantanee.</p>
              </div>
            </div>
          </div>
        </div>
        
    <!-- Upcoming Events Section -->
    <div class="py-16 bg-gray-50 px-4 sm:px-6 lg:px-8">
      <div class="max-w-6xl mx-auto">
        <div class="text-center mb-12">
          <h2 class="text-3xl font-bold text-gray-900 mb-4">Evenimente Viitoare</h2>
          <p class="text-lg text-gray-600">Descoperă evenimentele aprobate care vor avea loc în perioada următoare</p>
        </div>
        
        <!-- Loading State -->
        <div v-if="isLoadingEvents" class="flex justify-center py-8">
          <div class="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-orange-500"></div>
        </div>
        
        <!-- Error State -->
        <div v-else-if="eventsError" class="text-center py-8">
          <p class="text-red-600">{{ eventsError }}</p>
        </div>
        
        <!-- No Events -->
        <div v-else-if="upcomingEvents.length === 0" class="text-center py-8">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <h3 class="text-xl font-medium text-gray-900 mb-2">Nu sunt evenimente viitoare</h3>
          <p class="text-gray-600 mb-4">Nu există evenimente aprobate programate pentru perioada următoare.</p>
          <NuxtLink 
            to="/events/create" 
            class="inline-flex items-center bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-md font-medium transition"
          >
            Creează primul eveniment
          </NuxtLink>
        </div>
        
        <!-- Events Grid -->
        <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div 
            v-for="event in upcomingEvents" 
            :key="event._id"
            class="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
          >
            <div class="p-6">
              <div class="flex items-start justify-between mb-3">
                <h3 class="text-lg font-semibold text-gray-900 line-clamp-2">{{ event.name }}</h3>
                <span class="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                  Aprobat
                </span>
              </div>
              
              <div class="space-y-2 mb-4">
                <div class="flex items-center text-sm text-gray-600">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  {{ formatEventDate(event.eventDate) }}
                </div>
                
                <div class="flex items-center text-sm text-gray-600">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {{ formatEventTime(event.startTime) }} - {{ formatEventTime(event.endTime) }}
                </div>
                
                <div v-if="event.room" class="flex items-center text-sm text-gray-600">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {{ event.room.name }}
                </div>
                
                <div v-if="event.attendees" class="flex items-center text-sm text-gray-600">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                  {{ event.attendees }} participanți
                </div>
              </div>
              
              <p v-if="event.description" class="text-sm text-gray-600 mb-4">
                {{ event.description }}
              </p>
              
              <NuxtLink 
                :to="`/events/${event._id}`"
                class="inline-flex items-center text-orange-500 hover:text-orange-600 font-medium text-sm"
              >
                Vezi detalii
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 ml-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" clip-rule="evenodd" />
                </svg>
              </NuxtLink>
            </div>
          </div>
        </div>

        <!-- View All Events Button -->
        <div v-if="upcomingEvents.length > 0" class="text-center mt-8">
          <NuxtLink 
            to="/events" 
            class="inline-flex items-center bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-md font-medium transition"
          >
            Vezi toate evenimentele
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 ml-2" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" clip-rule="evenodd" />
            </svg>
          </NuxtLink>
        </div>
      </div>
    </div>
    
  </div>
</template>
