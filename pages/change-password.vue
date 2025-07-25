<script setup>
definePageMeta({
  layout: 'default',
  requiresAuth: true
})

const router = useRouter()
const toast = useToast()

// Form state
const formData = ref({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
})

// Validation and loading state
const errors = ref({})
const serverError = ref('')
const isLoading = ref(false)

// Form validation
const validateForm = () => {
  const newErrors = {}
  
  if (!formData.value.currentPassword) {
    newErrors.currentPassword = 'Parola curentă este obligatorie'
  }
  
  if (!formData.value.newPassword) {
    newErrors.newPassword = 'Parola nouă este obligatorie'
  } else if (formData.value.newPassword.length < 6) {
    newErrors.newPassword = 'Parola nouă trebuie să aibă cel puțin 6 caractere'
  }
  
  if (!formData.value.confirmPassword) {
    newErrors.confirmPassword = 'Confirmarea parolei este obligatorie'
  } else if (formData.value.confirmPassword !== formData.value.newPassword) {
    newErrors.confirmPassword = 'Parolele nu se potrivesc'
  }
  
  if (formData.value.currentPassword && formData.value.newPassword && 
      formData.value.currentPassword === formData.value.newPassword) {
    newErrors.newPassword = 'Parola nouă trebuie să fie diferită de cea curentă'
  }
  
  errors.value = newErrors
  return Object.keys(newErrors).length === 0
}

// Handle form submission
const handleSubmit = async () => {
  if (!validateForm()) {
    return
  }
  
  try {
    isLoading.value = true
    serverError.value = ''
    
    const response = await fetch('/api/auth/change-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(formData.value)
    })
    
    const data = await response.json()
    
    if (data.success) {
      toast.success({ 
        title: 'Succes', 
        message: 'Parola a fost schimbată cu succes!',
        position: 'bottomRight'
      })
      
      // Reset form
      formData.value = {
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }
      
      // Redirect to profile after a short delay
      setTimeout(() => {
        router.push('/profile')
      }, 1500)
    } else {
      serverError.value = data.message || 'Nu s-a putut schimba parola'
      toast.error({ 
        title: 'Eroare', 
        message: serverError.value,
        position: 'bottomRight'
      })
    }
  } catch (error) {
    console.error('Error changing password:', error)
    serverError.value = 'A apărut o eroare neașteptată'
    toast.error({ 
      title: 'Eroare', 
      message: serverError.value,
      position: 'bottomRight'
    })
  } finally {
    isLoading.value = false
  }
}

// Handle key down event for form submission
const handleKeyDown = (event) => {
  if (event.key === 'Enter') {
    handleSubmit()
  }
}
</script>

<template>
  <div class="px-4 sm:px-6 lg:px-8">
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-3xl font-bold text-gray-900">Schimbă Parola</h1>
      <NuxtLink 
        to="/profile" 
        class="text-orange-500 hover:text-orange-600 font-medium"
      >
        Înapoi la Profil
      </NuxtLink>
    </div>
    
    <div class="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
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
        <!-- Current Password -->
        <div>
          <label for="currentPassword" class="block text-sm font-medium text-gray-700 mb-1">
            Parola Curentă *
          </label>
          <input
            id="currentPassword"
            v-model="formData.currentPassword"
            type="password"
            placeholder="Introdu parola curentă"
            class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition"
            :class="{'border-red-500': errors.currentPassword}"
            @keydown="handleKeyDown"
            aria-label="Current password"
          />
          <p v-if="errors.currentPassword" class="mt-1 text-sm text-red-600">{{ errors.currentPassword }}</p>
        </div>
        
        <!-- New Password -->
        <div>
          <label for="newPassword" class="block text-sm font-medium text-gray-700 mb-1">
            Parola Nouă *
          </label>
          <input
            id="newPassword"
            v-model="formData.newPassword"
            type="password"
            placeholder="Introdu parola nouă"
            class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition"
            :class="{'border-red-500': errors.newPassword}"
            @keydown="handleKeyDown"
            aria-label="New password"
          />
          <p v-if="errors.newPassword" class="mt-1 text-sm text-red-600">{{ errors.newPassword }}</p>
          <p class="mt-1 text-xs text-gray-500">Parola trebuie să aibă cel puțin 6 caractere</p>
        </div>
        
        <!-- Confirm New Password -->
        <div>
          <label for="confirmPassword" class="block text-sm font-medium text-gray-700 mb-1">
            Confirmă Parola Nouă *
          </label>
          <input
            id="confirmPassword"
            v-model="formData.confirmPassword"
            type="password"
            placeholder="Confirmă parola nouă"
            class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition"
            :class="{'border-red-500': errors.confirmPassword}"
            @keydown="handleKeyDown"
            aria-label="Confirm new password"
          />
          <p v-if="errors.confirmPassword" class="mt-1 text-sm text-red-600">{{ errors.confirmPassword }}</p>
        </div>
        
        <!-- Submit Button -->
        <div class="pt-4">
          <button
            type="submit"
            class="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-md font-medium transition focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
            :class="{'opacity-70 cursor-not-allowed': isLoading}"
            :disabled="isLoading"
            tabindex="0"
            aria-label="Change password"
          >
            <span v-if="isLoading">Se schimbă parola...</span>
            <span v-else>Schimbă Parola</span>
          </button>
        </div>
        
        <!-- Cancel Button -->
        <div>
          <NuxtLink
            to="/profile"
            class="w-full block text-center border border-gray-300 text-gray-700 py-3 rounded-md font-medium hover:bg-gray-50 transition"
          >
            Anulează
          </NuxtLink>
        </div>
      </form>
    </div>
  </div>
</template> 