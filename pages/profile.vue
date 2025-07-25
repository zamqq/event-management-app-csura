<script setup>
definePageMeta({
  layout: 'default',
  requiresAuth: true
})

const { user } = useAuth()
</script>

<template>
  <div class="px-4 sm:px-6 lg:px-8">
    <div class="mb-6">
      <h1 class="text-3xl font-bold text-gray-900">Profilul Meu</h1>
    </div>
    <div class="max-w-3xl mx-auto bg-white rounded-lg shadow-md p-8">
      <div v-if="user" class="space-y-6">
        <div class="flex items-center space-x-4">
          <div class="h-16 w-16 rounded-full bg-orange-500 flex items-center justify-center text-white text-2xl">
            {{ user.fullName.charAt(0) }}
          </div>
          <div>
            <h2 class="text-xl font-semibold">{{ user.fullName }}</h2>
            <p class="text-gray-600">{{ user.email }}</p>
          </div>
        </div>
        
        <div class="border-t border-gray-200 pt-6">
          <h3 class="text-lg font-medium mb-4">Informații Cont</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div class="text-sm text-gray-500">Nume Complet</div>
              <div class="text-gray-800">{{ user.fullName }}</div>
            </div>
            <div>
              <div class="text-sm text-gray-500">Email</div>
              <div class="text-gray-800">{{ user.email }}</div>
            </div>
            <div>
              <div class="text-sm text-gray-500">Rol</div>
              <div class="text-gray-800">{{ user.role }}</div>
            </div>
            <div>
              <div class="text-sm text-gray-500">Membru Din</div>
              <div class="text-gray-800">{{ new Date(user.createdAt).toLocaleDateString('ro-RO', { day: '2-digit', month: '2-digit', year: 'numeric' }) }}</div>
            </div>
          </div>
        </div>
        
        <div class="flex space-x-4 pt-4">
          <NuxtLink
            to="/change-password"
            class="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition"
          >
            Schimbă Parola
          </NuxtLink>
        </div>
      </div>
      
      <div v-else class="text-center py-8">
        <p class="text-gray-600">Se încarcă informațiile profilului...</p>
      </div>
    </div>
  </div>
</template> 