// https://nuxt.com/docs/api/configuration/nuxt-config
import tailwindcss from "@tailwindcss/vite";

export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true },
  css: ['~/assets/css/main.css'],
  
  // Add proper meta tags for mobile and prevent FOUC
  app: {
    head: {
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'format-detection', content: 'telephone=no' }
      ]
    }
  },
  
  // Optimize rendering and hydration
  ssr: true,
  experimental: {
    payloadExtraction: false
  },
  modules: [
    'nuxt-toast'
  ],
  vite: {
    plugins: [
      tailwindcss(),
    ]
  },
  nitro: {
    experimental: {
      wasm: true
    }
  },
  runtimeConfig: {
    // Server-side environmental variables
    mongodbUri: process.env.MONGODB_URI,
    jwtSecret: process.env.JWT_SECRET,
    jwtExpiresIn: process.env.JWT_EXPIRES_IN,
    // Public variables
    public: {
      apiBaseUrl: process.env.API_BASE_URL || '/api'
    }
  }
})
