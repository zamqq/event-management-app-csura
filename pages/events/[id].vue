<script setup>
const route = useRoute()
const router = useRouter()
const toast = useToast()

// State management
const currentEvent = ref(null)
const isLoading = ref(true)
const error = ref('')
const isGeneratingPdf = ref(false)

// User authentication
const { data: authUser } = useFetch('/api/auth/me')
const isAdmin = computed(() => {
  // Check if the user data exists and has admin role
  return authUser.value?.user?.role === 'admin'
})
const canEditEvent = computed(() => {
  if (isAdmin.value) return true
  if (!authUser.value?.user || !currentEvent.value?.organizer) return false
  
  const organizerId = currentEvent.value.organizer._id || currentEvent.value.organizer
  return authUser.value.user.id === organizerId
})

// Fetch event data
const fetchEvent = async () => {
  try {
    isLoading.value = true
    error.value = ''
    
    const response = await fetch(`/api/events/${route.params.id}`)
    const data = await response.json()
    
    if (data.success) {
      currentEvent.value = data.event
    } else {
      error.value = data.message || 'Nu s-a putut încărca evenimentul'
    }
  } catch (error) {
    console.error('Error fetching event:', error)
    error.value = 'A apărut o eroare neașteptată'
  } finally {
    isLoading.value = false
  }
}

// Generate PDF
const handleGeneratePdf = async () => {
  try {
    isGeneratingPdf.value = true
    toast.success({ 
      title: 'PDF', 
      message: 'Se generează PDF-ul...',
      position: 'bottomRight'
    })
    
    const response = await fetch(`/api/events/${route.params.id}/pdf`)
    
    if (!response.ok) {
      throw new Error('Failed to generate PDF')
    }
    
    const blob = await response.blob()
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `eveniment-${currentEvent.value.name}-${route.params.id}.pdf`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
    
    toast.success({ 
      title: 'Succes', 
      message: 'PDF-ul a fost generat cu succes!',
      position: 'bottomRight'
    })
  } catch (error) {
    console.error('Error generating PDF:', error)
    toast.error({ 
      title: 'Eroare', 
      message: 'A apărut o eroare la generarea PDF-ului',
      position: 'bottomRight'
    })
  } finally {
    isGeneratingPdf.value = false
  }
}

// Delete event
const deleteEvent = async () => {
  if (!confirm('Ești sigur că vrei să ștergi acest eveniment?')) {
    return
  }
  
  try {
    const response = await fetch(`/api/events/${currentEvent.value._id}`, {
      method: 'DELETE'
    })
    
    const data = await response.json()
    
    if (data.success) {
      toast.success({ 
        title: 'Succes', 
        message: 'Evenimentul a fost șters cu succes!',
        position: 'bottomRight'
      })
      router.push('/events')
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

// Update event status
const updateEventStatus = async (newStatus) => {
  try {
    const response = await fetch(`/api/events/${currentEvent.value._id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ status: newStatus })
    })
    
    const data = await response.json()
    
    if (data.success) {
      currentEvent.value = data.event
      toast.success({ 
        title: 'Succes', 
        message: `Evenimentul a fost ${newStatus === 'approved' ? 'aprobat' : newStatus === 'rejected' ? 'respins' : newStatus === 'pending' ? 'marcat ca în așteptare' : 'anulat'} cu succes!`,
        position: 'bottomRight'
      })
    } else {
      toast.error({ 
        title: 'Eroare', 
        message: data.message || `Nu s-a putut actualiza statusul evenimentului`,
        position: 'bottomRight'
      })
    }
  } catch (error) {
    console.error('Error updating event status:', error)
    toast.error({ 
      title: 'Eroare', 
      message: 'A apărut o eroare neașteptată',
      position: 'bottomRight'
    })
  }
}

// Cancel event with confirmation
const cancelEvent = async () => {
  if (!confirm('Ești sigur că vrei să anulezi acest eveniment?')) {
    return
  }
  
  await updateEventStatus('cancelled')
}

// Format date
const formatDate = (dateString) => {
  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }
  return new Date(dateString).toLocaleDateString('ro-RO', options)
}

// Format time
const formatTime = (timeString) => {
  if (!timeString) return ''
  
  try {
    const [hours, minutes] = timeString.split(':')
    const time = new Date()
    time.setHours(hours)
    time.setMinutes(minutes)
    
    return time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  } catch (error) {
    return timeString
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

// Handle key down event for buttons
const handleKeyDown = (event) => {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault()
    event.target.click()
  }
}

// Translate category to Romanian
const translateCategory = (category) => {
  const translations = {
    'Office Supplies': 'Rechizite Birou',
    'Furniture': 'Mobilier',
    'Technology': 'Tehnologie',
    'Promotional Materials': 'Materiale Promoționale',
    'Consumables': 'Consumabile',
    'Other': 'Altele'
  }
  return translations[category] || category
}

// Fetch event on page load
onMounted(() => {
  fetchEvent()
})
</script>

<template>
  <div class="px-4 sm:px-6 lg:px-8">
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-3xl font-bold text-gray-900">Detalii Eveniment</h1>
      <NuxtLink 
        to="/events" 
        class="text-orange-500 hover:text-orange-600 font-medium"
      >
        Înapoi la Evenimente
      </NuxtLink>
    </div>
    
    <!-- Loading State -->
    <div v-if="isLoading" class="flex justify-center py-12">
      <div class="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-orange-500"></div>
    </div>
    
    <!-- Error Message -->
    <div v-else-if="error" class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
      {{ error }}
      <div class="mt-4">
        <NuxtLink to="/events" class="text-red-700 underline">Înapoi la Evenimente</NuxtLink>
      </div>
    </div>
    
    <!-- Event Information -->
    <div v-else-if="currentEvent" class="bg-white rounded-lg shadow-md overflow-hidden" data-pdf-content>
      <!-- Admin Action Buttons -->
      <div v-if="canEditEvent" class="bg-gray-100 px-6 py-3 flex justify-end space-x-4">
        <button 
          class="text-green-500 hover:text-green-600 font-medium inline-flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
          @click="handleGeneratePdf"
          @keydown="handleKeyDown"
          :disabled="isGeneratingPdf"
          tabindex="0"
          aria-label="Generate PDF"
        >
          <svg v-if="!isGeneratingPdf" xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <svg v-else class="animate-spin h-5 w-5 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          {{ isGeneratingPdf ? 'Generează PDF...' : 'Generează PDF' }}
        </button>
        
        <NuxtLink 
          :to="`/events/edit/${route.params.id}`"
          class="text-blue-500 hover:text-blue-600 font-medium inline-flex items-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          Editează Eveniment
        </NuxtLink>
        
        <button 
          class="text-red-500 hover:text-red-600 font-medium inline-flex items-center"
          @click="deleteEvent"
          @keydown="handleKeyDown"
          tabindex="0"
          aria-label="Delete event"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          Șterge Eveniment
        </button>
      </div>
      
      <!-- Room Image -->
      <div class="relative">
        <img 
          :src="currentEvent.room?.image" 
          :alt="currentEvent.room?.name" 
          class="w-full h-64 md:h-96 object-cover"
          @error="$event.target.src = '/images/default-room.jpg'"
        />
        <div 
          class="absolute top-4 right-4 px-3 py-1 rounded-md font-medium"
          :class="getStatusColor(currentEvent.status)"
        >
          {{ currentEvent.status ? (currentEvent.status === 'approved' ? 'Aprobat' : currentEvent.status === 'pending' ? 'În Așteptare' : currentEvent.status === 'rejected' ? 'Respins' : currentEvent.status === 'cancelled' ? 'Anulat' : currentEvent.status.charAt(0).toUpperCase() + currentEvent.status.slice(1)) : 'Necunoscut' }}
        </div>
      </div>
      
      <!-- Event Info -->
      <div class="p-6">
        <div class="flex flex-wrap justify-between items-start mb-4">
          <div>
            <h1 class="text-3xl font-bold text-gray-900 mb-2">{{ currentEvent.name }}</h1>
            <p class="text-lg text-gray-600">{{ formatDate(currentEvent.eventDate) }}</p>
            <p class="text-lg text-gray-600">{{ formatTime(currentEvent.startTime) }} - {{ formatTime(currentEvent.endTime) }}</p>
          </div>
          
          <div class="flex flex-col items-end space-y-3">
            <div class="bg-gray-100 text-gray-800 px-4 py-2 rounded-md text-lg font-medium">
              {{ currentEvent.attendees > 0 ? `${currentEvent.attendees} Participanți` : 'Fără participanți' }}
            </div>
            
            <!-- PDF Generation Button for all users -->
            <button 
              class="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-md font-medium inline-flex items-center disabled:opacity-50 disabled:cursor-not-allowed transition"
              @click="handleGeneratePdf"
              @keydown="handleKeyDown"
              :disabled="isGeneratingPdf"
              tabindex="0"
              aria-label="Generate PDF"
            >
              <svg v-if="!isGeneratingPdf" xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <svg v-else class="animate-spin h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {{ isGeneratingPdf ? 'Generează PDF...' : 'Descarcă PDF' }}
            </button>
          </div>
        </div>
        
        <!-- Room Information -->
        <div class="border-t border-gray-200 pt-6 pb-4">
          <h2 class="text-xl font-semibold text-gray-900 mb-4">Sala</h2>
          <div class="flex items-start">
            <div class="h-16 w-16 flex-shrink-0 bg-gray-200 rounded overflow-hidden mr-4">
              <img 
                :src="currentEvent.room?.image" 
                :alt="currentEvent.room?.name" 
                class="h-full w-full object-cover"
                @error="$event.target.src = '/images/default-room.jpg'"
              />
            </div>
            <div>
              <h3 class="text-lg font-medium text-gray-800">{{ currentEvent.room?.name }}</h3>
              <p class="text-gray-600">{{ currentEvent.room?.location }}</p>
              <p class="text-gray-600 mt-1">Capacitate: {{ currentEvent.room?.capacity }}</p>
            </div>
          </div>
        </div>
        
        <!-- Description -->
        <div v-if="currentEvent.description" class="border-t border-gray-200 pt-6 pb-4">
          <h2 class="text-xl font-semibold text-gray-900 mb-4">Descriere</h2>
          <p class="text-gray-700 mb-6">{{ currentEvent.description || 'Nu există descriere disponibilă.' }}</p>
        </div>
        
        <!-- Resources -->
        <div class="border-t border-gray-200 pt-6 pb-4">
          <h2 class="text-xl font-semibold text-gray-900 mb-4">Resurse</h2>
          
          <!-- New Resource format - with quantities -->
          <div v-if="currentEvent.resources && currentEvent.resources.length > 0" class="space-y-3 mb-6">
            <div 
              v-for="resourceItem in currentEvent.resources" 
              :key="resourceItem.resource._id || resourceItem.resource"
              class="flex items-center py-2 border-b border-gray-100"
            >
              <div class="flex-grow flex items-center">
                <div class="h-10 w-10 flex-shrink-0 bg-gray-200 rounded overflow-hidden mr-3">
                  <img 
                    :src="resourceItem.resource.image" 
                    :alt="resourceItem.resource.name" 
                    class="h-full w-full object-cover"
                    @error="$event.target.src = '/images/default-resource.jpg'"
                  />
                </div>
                <div>
                  <p class="font-medium text-gray-800">{{ resourceItem.resource.name || 'Resource' }}</p>
                  <p v-if="resourceItem.resource.category" class="text-xs text-gray-500">{{ translateCategory(resourceItem.resource.category) }}</p>
                </div>
              </div>
              <div class="text-gray-700 font-medium">
                Cant: {{ resourceItem.quantity }}
              </div>
            </div>
          </div>
          
          <!-- Legacy Resources format - simple tags -->
          <div v-if="currentEvent.legacyResources && currentEvent.legacyResources.length > 0" class="flex flex-wrap gap-2 mb-6">
            <span 
              v-for="resource in currentEvent.legacyResources" 
              :key="resource"
              class="bg-gray-100 text-gray-700 px-3 py-1 rounded-full"
            >
              {{ resource }}
            </span>
          </div>
          
          <!-- Old resources format for backward compatibility -->
          <div v-if="(!currentEvent.resources || currentEvent.resources.length === 0) && 
                      (!currentEvent.legacyResources || currentEvent.legacyResources.length === 0) &&
                      Array.isArray(currentEvent.resources) && 
                      currentEvent.resources.some(r => typeof r === 'string')" 
               class="flex flex-wrap gap-2 mb-6">
            <span 
              v-for="resource in currentEvent.resources" 
              :key="resource"
              class="bg-gray-100 text-gray-700 px-3 py-1 rounded-full"
            >
              {{ resource }}
            </span>
          </div>
          
          <span v-if="(!currentEvent.resources || currentEvent.resources.length === 0) && 
                      (!currentEvent.legacyResources || currentEvent.legacyResources.length === 0) &&
                      !(Array.isArray(currentEvent.resources) && currentEvent.resources.some(r => typeof r === 'string'))" 
                class="text-gray-500">
            Nu s-au solicitat resurse.
          </span>
        </div>
        
        <!-- Organizer Info -->
        <div class="border-t border-gray-200 pt-6">
          <h2 class="text-xl font-semibold text-gray-900 mb-4">Organizator</h2>
          <div class="flex items-center">
            <div class="bg-orange-100 text-orange-800 h-10 w-10 rounded-full flex items-center justify-center font-medium text-lg mr-3">
              {{ currentEvent.organizer?.fullName ? currentEvent.organizer.fullName.charAt(0).toUpperCase() : '?' }}
            </div>
            <div>
              <p class="font-medium text-gray-900">{{ currentEvent.organizer?.fullName || 'Necunoscut' }}</p>
              <p class="text-gray-600">{{ currentEvent.organizer?.email || 'Nu s-a furnizat email' }}</p>
            </div>
          </div>
        </div>
        
        <!-- Admin Actions for Changing Status -->
        <div v-if="isAdmin && currentEvent.status !== 'cancelled'" class="border-t border-gray-200 mt-6 pt-6">
          <h2 class="text-xl font-semibold text-gray-900 mb-4">Acțiuni Administrator</h2>
          <div class="flex flex-wrap gap-3">
            <button 
              v-if="currentEvent.status !== 'approved'"
              @click="updateEventStatus('approved')"
              @keydown="handleKeyDown"
              class="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md font-medium transition"
              tabindex="0"
              aria-label="Approve event"
            >
              Aprobă Eveniment
            </button>
            
            <button 
              v-if="currentEvent.status !== 'rejected'"
              @click="updateEventStatus('rejected')"
              @keydown="handleKeyDown"
              class="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md font-medium transition"
              tabindex="0"
              aria-label="Reject event"
            >
              Respinge Eveniment
            </button>
            
            <button 
              v-if="currentEvent.status !== 'pending'"
              @click="updateEventStatus('pending')"
              @keydown="handleKeyDown"
              class="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-md font-medium transition"
              tabindex="0"
              aria-label="Mark as pending"
            >
              Marchează ca În Așteptare
            </button>
          </div>
        </div>
        
        <!-- Cancel Event Button (for organizer) -->
        <div v-if="(canEditEvent || isAdmin) && currentEvent.status !== 'cancelled'" class="border-t border-gray-200 mt-6 pt-6">
          <button 
            @click="cancelEvent"
            @keydown="handleKeyDown"
            class="w-full border border-red-300 text-red-600 hover:bg-red-50 py-3 rounded-md font-medium transition"
            tabindex="0"
            aria-label="Cancel event"
          >
            Anulează Eveniment
          </button>
        </div>
      </div>
    </div>
    
    <!-- Not Found -->
    <div v-else class="bg-white rounded-lg shadow-md p-12 text-center">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <h2 class="text-xl font-medium text-gray-800 mb-2">Eveniment Nu A Fost Găsit</h2>
      <p class="text-gray-600 mb-6">Evenimentul pe care îl cauți nu există sau a fost eliminat.</p>
      <NuxtLink 
        to="/events" 
        class="inline-flex items-center bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-md font-medium transition"
      >
        Înapoi la Evenimente
      </NuxtLink>
    </div>
  </div>
</template> 