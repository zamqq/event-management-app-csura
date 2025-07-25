<script setup>
definePageMeta({
  middleware: ['admin'] // Use admin middleware to restrict to admin users only
})

const router = useRouter()
const toast = useToast()

// State management
const resourceData = ref({
  name: '',
  description: '',
  category: 'Office Supplies',
  totalQuantity: 1,
  availableQuantity: 1,
  image: '/images/default-resource.jpg',
  isAvailable: true
})

// Validation
const errors = ref({})
const serverError = ref('')
const isLoading = ref(false)

// Category options
const categoryOptions = [
  { value: 'Office Supplies', label: 'Rechizite Birou' },
  { value: 'Furniture', label: 'Mobilier' },
  { value: 'Technology', label: 'Tehnologie' },
  { value: 'Promotional Materials', label: 'Materiale Promoționale' },
  { value: 'Consumables', label: 'Consumabile' },
  { value: 'Other', label: 'Altele' }
]

// Form validation
const validateForm = () => {
  const newErrors = {}
  
  if (!resourceData.value.name?.trim()) {
    newErrors.name = 'Numele resursei este obligatoriu'
  }
  
  if (resourceData.value.totalQuantity < 1) {
    newErrors.totalQuantity = 'Cantitatea totală trebuie să fie cel puțin 1'
  }
  
  if (resourceData.value.availableQuantity < 0) {
    newErrors.availableQuantity = 'Cantitatea disponibilă nu poate fi negativă'
  }
  
  if (resourceData.value.availableQuantity > resourceData.value.totalQuantity) {
    newErrors.availableQuantity = 'Cantitatea disponibilă nu poate depăși cantitatea totală'
  }
  
  errors.value = newErrors
  return Object.keys(newErrors).length === 0
}

// Handle available quantity auto-update
const handleTotalQuantityChange = () => {
  // Set available quantity equal to total quantity when total quantity changes
  resourceData.value.availableQuantity = resourceData.value.totalQuantity
}

// Submit form
const handleSubmit = async () => {
  if (!validateForm()) {
    return
  }
  
  try {
    isLoading.value = true
    serverError.value = ''
    
    const response = await fetch('/api/resources', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(resourceData.value)
    })
    
    const data = await response.json()
    
    if (data.success) {
      toast.success({ 
        title: 'Succes', 
        message: 'Resursa a fost creată cu succes!',
        position: 'bottomRight'
      })
      router.push('/resources')
    } else {
      serverError.value = data.message || 'Nu s-a putut crea resursa'
      toast.error(serverError.value)
    }
  } catch (error) {
    console.error('Error creating resource:', error)
    serverError.value = 'A apărut o eroare neașteptată'
    toast.error(serverError.value)
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
</script>

<template>
  <div class="px-4 sm:px-6 lg:px-8">
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-3xl font-bold text-gray-900">Adaugă Resursă</h1>
      <NuxtLink 
        to="/resources" 
        class="text-orange-500 hover:text-orange-600 font-medium"
      >
        Înapoi la Resurse
      </NuxtLink>
    </div>
    
    <div class="bg-white rounded-lg shadow-md p-6">
      <!-- Server Error -->
      <div v-if="serverError" class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
        <div class="flex">
          <div class="flex-shrink-0">
            <svg class="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
            </svg>
          </div>
          <div class="ml-3">
            <p class="text-sm font-medium">{{ serverError }}</p>
          </div>
        </div>
      </div>
      
      <form @submit.prevent="handleSubmit" class="space-y-6">
        <!-- Resource Name -->
        <div>
          <label for="name" class="block text-sm font-medium text-gray-700 mb-1">Numele Resursei *</label>
          <input
            id="name"
            v-model="resourceData.name"
            type="text"
            placeholder="Introdu numele resursei"
            class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition"
            :class="{'border-red-500': errors.name}"
          />
          <p v-if="errors.name" class="mt-1 text-sm text-red-600">{{ errors.name }}</p>
        </div>
        
        <!-- Category -->
        <div>
          <label for="category" class="block text-sm font-medium text-gray-700 mb-1">Categoria *</label>
          <select
            id="category"
            v-model="resourceData.category"
            class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition"
          >
            <option v-for="category in categoryOptions" :key="category.value" :value="category.value">
              {{ category.label }}
            </option>
          </select>
        </div>
        
        <!-- Quantities -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label for="totalQuantity" class="block text-sm font-medium text-gray-700 mb-1">Cantitate Totală *</label>
            <input
              id="totalQuantity"
              v-model.number="resourceData.totalQuantity"
              @change="handleTotalQuantityChange"
              type="number"
              min="1"
              step="1"
              class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition"
              :class="{'border-red-500': errors.totalQuantity}"
            />
            <p v-if="errors.totalQuantity" class="mt-1 text-sm text-red-600">{{ errors.totalQuantity }}</p>
          </div>
          
          <div>
            <label for="availableQuantity" class="block text-sm font-medium text-gray-700 mb-1">Cantitate Disponibilă *</label>
            <input
              id="availableQuantity"
              v-model.number="resourceData.availableQuantity"
              type="number"
              min="0"
              step="1"
              class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition"
              :class="{'border-red-500': errors.availableQuantity}"
            />
            <p v-if="errors.availableQuantity" class="mt-1 text-sm text-red-600">{{ errors.availableQuantity }}</p>
            <p class="mt-1 text-xs text-gray-500">În mod normal este egală cu cantitatea totală pentru resurse noi</p>
          </div>
        </div>
        
        <!-- Description -->
        <div>
          <label for="description" class="block text-sm font-medium text-gray-700 mb-1">Descriere</label>
          <textarea
            id="description"
            v-model="resourceData.description"
            rows="3"
            placeholder="Introdu descrierea resursei"
            class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition"
          ></textarea>
        </div>
        
        <!-- Image URL -->
        <div>
          <label for="image" class="block text-sm font-medium text-gray-700 mb-1">URL Imagine</label>
          <input
            id="image"
            v-model="resourceData.image"
            type="text"
            placeholder="Introdu URL-ul imaginii"
            class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition"
          />
          <p class="mt-1 text-xs text-gray-500">Lasă gol pentru a folosi imaginea implicită</p>
        </div>
        
        <!-- Availability Toggle -->
        <div class="flex items-center">
          <input
            id="isAvailable"
            v-model="resourceData.isAvailable"
            type="checkbox"
            class="h-4 w-4 text-orange-500 focus:ring-orange-500 border-gray-300 rounded"
          />
          <label for="isAvailable" class="ml-2 block text-sm text-gray-700">
            Resursa este disponibilă pentru rezervare
          </label>
        </div>
        
        <!-- Submit Button -->
        <div class="pt-4">
          <button
            type="submit"
            class="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-md font-medium transition"
            :class="{'opacity-70 cursor-not-allowed': isLoading}"
            :disabled="isLoading"
            tabindex="0"
            aria-label="Create resource"
          >
            <span v-if="isLoading">Se creează resursa...</span>
            <span v-else>Creează Resursa</span>
          </button>
        </div>
      </form>
    </div>
  </div>
</template> 