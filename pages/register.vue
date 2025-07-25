<script setup>
import { ref, computed } from 'vue'

definePageMeta({
  layout: 'default',
  authRoute: true
})

const fullName = ref('')
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const agreeTerms = ref(false)
const errors = ref({})

const { register, isLoading, error: authError } = useAuth()

const serverError = computed(() => authError.value)

const validateForm = () => {
  const newErrors = {}
  
  if (!fullName.value.trim()) {
    newErrors.fullName = 'Numele complet este obligatoriu'
  }
  
  if (!email.value) {
    newErrors.email = 'Email-ul este obligatoriu'
  } else if (!/^\S+@\S+\.\S+$/.test(email.value)) {
    newErrors.email = 'Te rog să introduci un email valid'
  }
  
  if (!password.value) {
    newErrors.password = 'Parola este obligatorie'
  } else if (password.value.length < 6) {
    newErrors.password = 'Parola trebuie să aibă cel puțin 6 caractere'
  }
  
  if (!confirmPassword.value) {
    newErrors.confirmPassword = 'Te rog să confirmi parola'
  } else if (confirmPassword.value !== password.value) {
    newErrors.confirmPassword = 'Parolele nu se potrivesc'
  }
  
  if (!agreeTerms.value) {
    newErrors.agreeTerms = 'Trebuie să accepți termenii și condițiile'
  }
  
  errors.value = newErrors
  return Object.keys(newErrors).length === 0
}

const handleSubmit = async () => {
  if (!validateForm()) return
  
  try {
    await register({
      fullName: fullName.value,
      email: email.value,
      password: password.value,
      confirmPassword: confirmPassword.value
    })
    
    // If registration successful, page will be redirected by the register function
  } catch (error) {
    // Error is handled by the useAuth composable
    console.error('Registration failed:', error)
  }
}

const handleKeyDown = (event) => {
  if (event.key === 'Enter') {
    handleSubmit()
  }
}
</script>

<template>
  <div class="container max-w-md mx-auto px-4 py-12">
    <div class="bg-white rounded-lg shadow-md p-8">
      <h1 class="text-3xl font-bold text-gray-900 mb-6 text-center">Creează Cont</h1>
      
      <div v-if="serverError" class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
        {{ serverError }}
      </div>
      
      <form @submit.prevent="handleSubmit" class="space-y-5">
        <div>
          <label for="fullName" class="block text-sm font-medium text-gray-700 mb-1">Nume Complet</label>
          <input
            id="fullName"
            v-model="fullName"
            type="text"
            placeholder="Introdu numele tău complet"
            class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition"
            :class="{'border-red-500': errors.fullName}"
            @keydown="handleKeyDown"
            aria-label="Full name"
          />
          <p v-if="errors.fullName" class="mt-1 text-sm text-red-600">{{ errors.fullName }}</p>
        </div>
        
        <div>
          <label for="email" class="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input
            id="email"
            v-model="email"
            type="email"
            placeholder="Introdu email-ul tău"
            class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition"
            :class="{'border-red-500': errors.email}"
            @keydown="handleKeyDown"
            aria-label="Email address"
          />
          <p v-if="errors.email" class="mt-1 text-sm text-red-600">{{ errors.email }}</p>
        </div>
        
        <div>
          <label for="password" class="block text-sm font-medium text-gray-700 mb-1">Parola</label>
          <input
            id="password"
            v-model="password"
            type="password"
            placeholder="Creează o parolă"
            class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition"
            :class="{'border-red-500': errors.password}"
            @keydown="handleKeyDown"
            aria-label="Password"
          />
          <p v-if="errors.password" class="mt-1 text-sm text-red-600">{{ errors.password }}</p>
        </div>
        
        <div>
          <label for="confirmPassword" class="block text-sm font-medium text-gray-700 mb-1">Confirmă Parola</label>
          <input
            id="confirmPassword"
            v-model="confirmPassword"
            type="password"
            placeholder="Confirmă parola ta"
            class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition"
            :class="{'border-red-500': errors.confirmPassword}"
            @keydown="handleKeyDown"
            aria-label="Confirm password"
          />
          <p v-if="errors.confirmPassword" class="mt-1 text-sm text-red-600">{{ errors.confirmPassword }}</p>
        </div>
        
        <div class="flex items-start">
          <div class="flex items-center h-5">
            <input
              id="agree-terms"
              v-model="agreeTerms"
              type="checkbox"
              class="h-4 w-4 text-orange-500 focus:ring-orange-500 border-gray-300 rounded"
              :class="{'border-red-500': errors.agreeTerms}"
            />
          </div>
          <div class="ml-3 text-sm">
            <label for="agree-terms" class="text-gray-700">
              Sunt de acord cu 
              <a href="#" class="text-orange-500 hover:text-orange-600">Termenii de Serviciu</a>
              și
              <a href="http://privacy.rau.ro/" class="text-orange-500 hover:text-orange-600">Politica de Confidențialitate</a>
            </label>
            <p v-if="errors.agreeTerms" class="mt-1 text-sm text-red-600">{{ errors.agreeTerms }}</p>
          </div>
        </div>
        
        <button
          type="submit"
          class="w-full bg-orange-500 hover:bg-orange-600 text-white py-2 px-4 rounded-md font-medium transition focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 mt-6"
          :class="{'opacity-70 cursor-not-allowed': isLoading}"
          :disabled="isLoading"
          aria-label="Create your account"
        >
          <span v-if="isLoading">Se creează contul...</span>
          <span v-else>Creează Cont</span>
        </button>
      </form>
      
      <div class="mt-6 text-center">
        <p class="text-sm text-gray-600">
          Ai deja un cont?
          <NuxtLink to="/login" class="text-orange-500 hover:text-orange-600 font-medium">Autentifică-te</NuxtLink>
        </p>
      </div>
    </div>
  </div>
</template> 