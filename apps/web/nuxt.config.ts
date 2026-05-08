import tailwindcss from "@tailwindcss/vite";

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  
  devtools: { enabled: true },
  
  css: ['./app/assets/css/main.css'],

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
    '@nuxt/hints',
    '@nuxt/image',
    '@nuxt/scripts',
    '@nuxtjs/device',
    '@pinia/nuxt',
    'pinia-plugin-persistedstate/nuxt',
  ]
})