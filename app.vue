<template>
  <div>
    <!-- Add loading indicator for initial load -->
    <NuxtLoadingIndicator color="#f97316" />
    
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'

// Set proper meta tags for each page
useSeoMeta({
  titleTemplate: '%s - CS-URA',
  viewport: 'width=device-width, initial-scale=1',
  charset: 'utf-8'
})

// Ensure proper hydration
useHead({
  htmlAttrs: {
    lang: 'ro'
  },
  bodyAttrs: {
    class: 'antialiased'
  }
})

// Initialize auth as early as possible on client
onMounted(() => {
  if (import.meta.client) {
    const { initAuth } = useAuth()
    initAuth()
  }
})
</script>
