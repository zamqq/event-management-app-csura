<script setup>
import { ref, computed } from 'vue'

definePageMeta({
  layout: 'default',
  authRoute: true
})

const email = ref('')
const password = ref('')
const rememberMe = ref(false)
const errors = ref({})

const { login, isLoading, error: authError } = useAuth()

const serverError = computed(() => authError.value)

const validateForm = () => {
  const newErrors = {}
  
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
  
  errors.value = newErrors
  return Object.keys(newErrors).length === 0
}

const handleSubmit = async () => {
  if (!validateForm()) return
  
  try {
    await login({
      email: email.value,
      password: password.value,
      rememberMe: rememberMe.value
    })
    
    // If login successful, page will be redirected by the login function
  } catch (error) {
    // Error is handled by the useAuth composable
    console.error('Login failed:', error)
  }
}

const handleKeyDown = (event) => {
  if (event.key === 'Enter') {
    handleSubmit()
  }
}
</script>

<template>
  <div class="container max-w-md mx-auto px-4 py-16">
    <div class="bg-white rounded-lg shadow-md p-8">
      <h1 class="text-3xl font-bold text-gray-900 mb-6 text-center">Autentificare</h1>
      
      <div v-if="serverError" class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
        {{ serverError }}
      </div>
      
      <form @submit.prevent="handleSubmit" class="space-y-6">
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
          <div class="flex justify-between items-center mb-1">
            <label for="password" class="block text-sm font-medium text-gray-700">Parola</label>
            <a href="#" class="text-sm text-orange-500 hover:text-orange-600">Ai uitat parola?</a>
          </div>
          <input
            id="password"
            v-model="password"
            type="password"
            placeholder="Introdu parola ta"
            class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition"
            :class="{'border-red-500': errors.password}"
            @keydown="handleKeyDown"
            aria-label="Password"
          />
          <p v-if="errors.password" class="mt-1 text-sm text-red-600">{{ errors.password }}</p>
        </div>
        
        <div class="flex items-center">
          <input
            id="remember-me"
            v-model="rememberMe"
            type="checkbox"
            class="h-4 w-4 text-orange-500 focus:ring-orange-500 border-gray-300 rounded"
          />
          <label for="remember-me" class="ml-2 block text-sm text-gray-700">Ține-mă minte</label>
        </div>
        
        <button
          type="submit"
          class="w-full bg-orange-500 hover:bg-orange-600 text-white py-2 px-4 rounded-md font-medium transition focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
          :class="{'opacity-70 cursor-not-allowed': isLoading}"
          :disabled="isLoading"
          aria-label="Sign in to your account"
        >
          <span v-if="isLoading">Se autentifică...</span>
          <span v-else>Autentifică-te</span>
        </button>
      </form>
      
      <div class="mt-6 text-center">
        <p class="text-sm text-gray-600">
          Nu ai un cont?
          <NuxtLink to="/register" class="text-orange-500 hover:text-orange-600 font-medium">Înregistrează-te</NuxtLink>
        </p>
      </div>
    </div>
  </div>
</template> 