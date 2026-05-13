import tailwindcss from "@tailwindcss/vite";

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  
  // nitro: {
  //   routeRules: {
  //     '/api/runway/**': { timeout: 1500000 }, // 15 minutes
  //   }
  // },
  
  devtools: { enabled: true },
  
  css: ['./app/assets/css/main.css'],

  runtimeConfig: {
    modalBaseUrl: process.env.MODAL_BASE_URL,
  },
  
  vite: {
    plugins: [
      tailwindcss(),
    ],
  },

  // fonts: {
  //   families: [
  //     { name: 'Geist', weights: ['100 900'] },
  //     { name: 'Gelasio' },
  //   ],
  // },

  modules: [
    '@nuxt/eslint',
    '@nuxt/fonts',
    '@nuxt/image',
    '@nuxt/scripts',
    '@nuxtjs/device',
    '@pinia/nuxt',
    'pinia-plugin-persistedstate/nuxt',
  ]
})