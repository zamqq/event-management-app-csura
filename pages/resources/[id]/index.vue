<script setup>
definePageMeta({
  middleware: ['admin'] // Use admin middleware to restrict to admin users only
})

const route = useRoute()
const router = useRouter()
const toast = useToast()

// State management
const resourceId = route.params.id
const resource = ref(null)
const isLoading = ref(true)
const error = ref('')

// User authentication
const { data: authUser } = useFetch('/api/auth/me')
const isAdmin = computed(() => authUser.value?.user?.role === 'admin')

// Check if user can edit this resource
const canEditResource = computed(() => {
  if (isAdmin.value) return true
  if (!authUser.value?.user || !resource.value?.createdBy) return false
  
  return authUser.value.user.id === resource.value.createdBy
})

// Fetch resource details
const fetchResource = async () => {
  try {
    isLoading.value = true
    error.value = ''
    
    const response = await fetch(`/api/resources/${resourceId}`)
    const data = await response.json()
    
    if (data.success) {
      resource.value = data.resource
    } else {
      error.value = data.message || 'Nu s-a putut încărca resursa'
    }
  } catch (err) {
    console.error('Error fetching resource:', err)
    error.value = 'A apărut o eroare neașteptată'
  } finally {
    isLoading.value = false
  }
}

// Delete resource
const deleteResource = async () => {
  if (!confirm('Ești sigur că vrei să ștergi această resursă?')) {
    return
  }
  
  try {
    const response = await fetch(`/api/resources/${resourceId}`, {
      method: 'DELETE'
    })
    
    const data = await response.json()
    
    if (data.success) {
      toast.success({ 
        title: 'Succes', 
        message: 'Resursa a fost ștearsă cu succes',
        position: 'bottomRight'
      })
      router.push('/resources')
    } else {
      toast.error({ 
        title: 'Eroare', 
        message: data.message || 'Nu s-a putut șterge resursa',
        position: 'bottomRight'
      })
    }
  } catch (err) {
    console.error('Error deleting resource:', err)
    toast.error({ 
      title: 'Eroare', 
      message: 'A apărut o eroare neașteptată',
      position: 'bottomRight'
    })
  }
}

// Get resource category badge class
const getCategoryBadgeClass = (category) => {
  switch (category) {
    case 'Office Supplies':
      return 'bg-blue-100 text-blue-800'
    case 'Furniture':
      return 'bg-green-100 text-green-800'
    case 'Technology':
      return 'bg-purple-100 text-purple-800'
    case 'Promotional Materials':
      return 'bg-yellow-100 text-yellow-800'
    case 'Consumables':
      return 'bg-pink-100 text-pink-800'
    default:
      return 'bg-gray-100 text-gray-800'
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

// Format date
const formatDate = (dateString) => {
  const options = { year: 'numeric', month: 'long', day: 'numeric' }
  return new Date(dateString).toLocaleDateString('ro-RO', options)
}

// Handle key down event for buttons
const handleKeyDown = (event) => {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault()
    event.target.click()
  }
}

// Fetch data on page load
onMounted(() => {
  fetchResource()
})
</script>

<template>
  <div class="px-4 sm:px-6 lg:px-8">
    <!-- Header with back button -->
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-3xl font-bold text-gray-900">Detalii Resursă</h1>
      <NuxtLink 
        to="/resources" 
        class="text-orange-500 hover:text-orange-600 font-medium"
      >
        Înapoi la Resurse
      </NuxtLink>
    </div>
    
    <!-- Loading State -->
    <div v-if="isLoading" class="flex justify-center py-12">
      <div class="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-orange-500"></div>
    </div>
    
    <!-- Error Message -->
    <div v-else-if="error" class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
      {{ error }}
    </div>
    
    <!-- Resource Details -->
    <div v-else-if="resource" class="bg-white rounded-lg shadow-md overflow-hidden">
      <!-- Resource Image -->
      <div class="h-64 bg-gray-200 relative">
        <img 
          :src="resource.image" 
          :alt="resource.name" 
          class="w-full h-full object-cover"
          @error="$event.target.src = '/images/default-resource.jpg'"
        />
        <div 
          class="absolute top-4 right-4 px-3 py-1.5 rounded-md text-sm font-medium"
          :class="getCategoryBadgeClass(resource.category)"
        >
          {{ translateCategory(resource.category) }}
        </div>
      </div>
      
      <div class="p-6">
        <!-- Resource Name and Status -->
        <div class="flex justify-between items-start mb-4">
          <h2 class="text-2xl font-bold text-gray-900">{{ resource.name }}</h2>
          <span 
            class="inline-flex items-center px-2.5 py-1 rounded-full text-sm font-medium"
            :class="resource.isAvailable && resource.availableQuantity > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'"
          >
            {{ resource.isAvailable && resource.availableQuantity > 0 ? 'Disponibilă' : 'Indisponibilă' }}
          </span>
        </div>
        
        <!-- Resource Description -->
        <p v-if="resource.description" class="text-gray-700 mb-6">{{ resource.description }}</p>
        <p v-else class="text-gray-500 italic mb-6">Nu există descriere disponibilă.</p>
        
        <!-- Resource Details -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 mb-6">
          <div>
            <h3 class="text-sm font-medium text-gray-500">Cantitate Totală</h3>
            <p class="mt-1 text-lg font-medium text-gray-900">{{ resource.totalQuantity }}</p>
          </div>
          
          <div>
            <h3 class="text-sm font-medium text-gray-500">Cantitate Disponibilă</h3>
            <p class="mt-1 text-lg font-medium text-gray-900">{{ resource.availableQuantity }}</p>
          </div>
          
          <div>
            <h3 class="text-sm font-medium text-gray-500">Creată La</h3>
            <p class="mt-1 text-gray-900">{{ resource.createdAt ? formatDate(resource.createdAt) : 'Necunoscut' }}</p>
          </div>
          
          <div>
            <h3 class="text-sm font-medium text-gray-500">Ultima Actualizare</h3>
            <p class="mt-1 text-gray-900">{{ resource.updatedAt ? formatDate(resource.updatedAt) : 'Niciodată' }}</p>
          </div>
        </div>
        
        <!-- Actions -->
        <div v-if="canEditResource" class="flex justify-end space-x-4 pt-4 border-t border-gray-200">
          <NuxtLink 
            :to="`/resources/${resource._id}/edit`"
            class="bg-blue-100 hover:bg-blue-200 text-blue-700 px-4 py-2 rounded flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Editează Resursa
          </NuxtLink>
          
          <button 
            @click="deleteResource"
            @keydown="handleKeyDown"
            class="bg-red-100 hover:bg-red-200 text-red-700 px-4 py-2 rounded flex items-center"
            tabindex="0"
            aria-label="Delete resource"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Șterge Resursa
          </button>
        </div>
      </div>
    </div>
    
    <!-- Not Found -->
    <div v-else class="bg-white rounded-lg shadow-md p-12 text-center">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <h2 class="text-xl font-medium text-gray-800 mb-2">Resursa Nu A Fost Găsită</h2>
      <p class="text-gray-600 mb-6">Resursa pe care o cauți nu există sau a fost eliminată.</p>
      <NuxtLink 
        to="/resources" 
        class="inline-flex items-center bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-md font-medium transition"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Înapoi la Resurse
      </NuxtLink>
    </div>
  </div>
</template> 