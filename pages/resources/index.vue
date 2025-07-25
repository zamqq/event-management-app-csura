<script setup>
const router = useRouter()
const toast = useToast()

// State management
const resources = ref([])
const isLoading = ref(true)
const error = ref('')

// Search and filter state
const searchQuery = ref('')
const selectedCategory = ref('')
const showOnlyAvailable = ref(false)
const minQuantity = ref('')

// User authentication
const { data: authUser } = useFetch('/api/auth/me')
const isAdmin = computed(() => authUser.value?.user?.role === 'admin')

// Category options for filter
const categoryOptions = [
  { value: '', label: 'Toate Categoriile' },
  { value: 'Office Supplies', label: 'Rechizite Birou' },
  { value: 'Furniture', label: 'Mobilier' },
  { value: 'Technology', label: 'Tehnologie' },
  { value: 'Promotional Materials', label: 'Materiale Promoționale' },
  { value: 'Consumables', label: 'Consumabile' },
  { value: 'Costume', label: 'Costume' },
  { value: 'Other', label: 'Altele' }
]

// Fetch resources
const fetchResources = async () => {
  try {
    isLoading.value = true
    error.value = ''
    
    // Build query params based on filters
    let queryParams = new URLSearchParams()
    
    if (searchQuery.value.trim()) {
      queryParams.append('search', searchQuery.value.trim())
    }
    
    if (selectedCategory.value) {
      queryParams.append('category', selectedCategory.value)
    }
    
    if (showOnlyAvailable.value) {
      queryParams.append('isAvailable', 'true')
    }
    
    if (minQuantity.value) {
      queryParams.append('minQuantity', minQuantity.value)
    }
    
    const query = queryParams.toString() ? `?${queryParams.toString()}` : ''
    const response = await fetch(`/api/resources${query}`)
    const data = await response.json()
    
    if (data.success) {
      resources.value = data.resources
    } else {
      error.value = data.message || 'Nu s-a putut încărca resursele'
    }
  } catch (err) {
    console.error('Error fetching resources:', err)
    error.value = 'A apărut o eroare neașteptată'
  } finally {
    isLoading.value = false
  }
}

// Apply filters
const applyFilters = () => {
  fetchResources()
}

// Reset filters
const resetFilters = () => {
  searchQuery.value = ''
  selectedCategory.value = ''
  showOnlyAvailable.value = false
  minQuantity.value = ''
  fetchResources()
}

// Handle search submit
const handleSearchSubmit = () => {
  applyFilters()
}

// Delete resource
const deleteResource = async (resourceId) => {
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
      
      // Remove the deleted resource from the list
      resources.value = resources.value.filter(r => r._id !== resourceId)
    } else {
      toast.error({ 
        title: 'Eroare', 
        message: data.message || 'Nu s-a putut șterge resursa',
        position: 'bottomRight'
      })
    }
  } catch (error) {
    console.error('Error deleting resource:', error)
    toast.error({ 
      title: 'Eroare', 
      message: 'A apărut o eroare neașteptată',
      position: 'bottomRight'
    })
  }
}

// Navigate to edit resource page
const navigateToEdit = (resourceId) => {
  router.push(`/resources/${resourceId}/edit`)
}

// Handle key down event for buttons
const handleKeyDown = (event) => {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault()
    event.target.click()
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

// Translate category names to Romanian
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

// Fetch resources on page load
onMounted(() => {
  fetchResources()
})
</script>

<template>
  <div class="px-4 sm:px-6 lg:px-8">
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-3xl font-bold text-gray-900">Resurse</h1>
      <NuxtLink 
        v-if="isAdmin"
        to="/resources/create" 
        class="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-md font-medium transition inline-flex items-center"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clip-rule="evenodd" />
        </svg>
        Adaugă Resursă
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
            placeholder="Caută resurse după nume sau descriere"
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
        <!-- Category Filter -->
        <div class="w-full md:w-auto">
          <label for="category" class="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
          <select
            id="category"
            v-model="selectedCategory"
            class="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition"
          >
            <option v-for="category in categoryOptions" :key="category.value" :value="category.value">
              {{ category.label }}
            </option>
          </select>
        </div>
        
        <!-- Minimum Quantity Filter -->
        <div class="w-full md:w-48">
          <label for="minQuantity" class="block text-sm font-medium text-gray-700 mb-1">Cantitate Minimă</label>
          <input
            id="minQuantity"
            v-model="minQuantity"
            type="number"
            min="1"
            placeholder="Cantitate minimă"
            class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition"
          />
        </div>
        
        <!-- Availability Filter -->
        <div class="w-full md:w-auto flex items-center">
          <div class="ml-1 mt-6">
            <label class="inline-flex items-center cursor-pointer mb-3">
              <input
                v-model="showOnlyAvailable"
                type="checkbox"
                class="h-4 w-4 text-orange-500 focus:ring-orange-500 border-gray-300 rounded"
              />
              <span class="ml-2 text-sm text-gray-700">Doar resursele disponibile</span>
            </label>
          </div>
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

    <!-- No Resources -->
    <div v-else-if="resources.length === 0" class="bg-white rounded-lg shadow p-6 text-center">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10" />
      </svg>
      <h3 class="text-xl font-medium text-gray-800 mb-2">Nu s-au găsit resurse</h3>
      <p class="text-gray-600 mb-6">Nu există resurse care să corespundă criteriilor tale.</p>
      <NuxtLink 
        v-if="isAdmin"
        to="/resources/create" 
        class="inline-flex items-center bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-md font-medium transition"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clip-rule="evenodd" />
        </svg>
        Adaugă Resursă
      </NuxtLink>
    </div>

    <!-- Resources List -->
    <div v-else class="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
      <div 
        v-for="resource in resources" 
        :key="resource._id"
        class="bg-white rounded-lg shadow-md overflow-hidden transition-transform hover:translate-y-[-4px]"
      >
        <!-- Resource Image -->
        <div class="h-48 bg-gray-200 relative">
          <img 
            :src="resource.image" 
            :alt="resource.name" 
            class="w-full h-full object-contain"
            @error="$event.target.src = '/images/default-resource.jpg'"
          />
          <div 
            class="absolute top-3 right-3 px-2 py-1 rounded-md text-sm font-medium"
            :class="getCategoryBadgeClass(resource.category)"
          >
            {{ translateCategory(resource.category) }}
          </div>
        </div>
        
        <!-- Resource Info -->
        <div class="p-4">
          <div class="flex justify-between items-start mb-2">
            <h2 class="text-xl font-semibold text-gray-900">{{ resource.name }}</h2>
            <div class="flex items-center">
              <span 
                class="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full"
                :class="resource.isAvailable && resource.availableQuantity > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'"
              >
                {{ resource.isAvailable && resource.availableQuantity > 0 ? 'Disponibilă' : 'Indisponibilă' }}
              </span>
            </div>
          </div>
          
          <p class="text-gray-600 mb-3" v-if="resource.description">{{ resource.description }}</p>
          
          <!-- Quantity Information -->
          <div class="flex justify-between items-center mb-4 text-sm text-gray-600">
            <div>
              <span class="font-medium">Disponibile:</span> {{ resource.availableQuantity }}
            </div>
            <div>
              <span class="font-medium">Total:</span> {{ resource.totalQuantity }}
            </div>
          </div>
          
          <!-- Actions -->
          <div class="flex justify-between pt-2 border-t border-gray-100">
            <NuxtLink 
              :to="`/resources/${resource._id}`"
              class="text-orange-500 hover:text-orange-600 font-medium text-sm"
            >
              Vezi Detalii
            </NuxtLink>
            
            <!-- Edit/Delete actions - only visible to admins -->
            <div v-if="isAdmin" class="flex space-x-3">
              <button
                @click="navigateToEdit(resource._id)"
                @keydown="handleKeyDown"
                class="bg-blue-100 hover:bg-blue-200 text-blue-700 text-sm px-2 py-1 rounded flex items-center"
                tabindex="0"
                aria-label="Edit resource"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Editează
              </button>
              
              <button
                @click="deleteResource(resource._id)"
                @keydown="handleKeyDown"
                class="bg-red-100 hover:bg-red-200 text-red-700 text-sm px-2 py-1 rounded flex items-center"
                tabindex="0"
                aria-label="Delete resource"
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