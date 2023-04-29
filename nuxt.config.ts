// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  ssr: false,

  /**
   * Runtime Config
   */
  runtimeConfig: {
    public: {
      api: 'http://localhost:1987' // TODO -> from environment
    }
  },

  /**
   * Vuetify Config
   * See https://codybontecou.com/how-to-use-vuetify-with-nuxt-3.html
   * See https://pictogrammers.github.io/@mdi/font/7.1.96/
   */
  css: [
    'vuetify/lib/styles/main.sass',
    '@mdi/font/css/materialdesignicons.min.css'
  ],
  build: {
    transpile: ['vuetify'],
  },
  vite: {
    define: {
      'process.env.DEBUG': false,
    },
  },

  /**
   * Vue Router Config
   */
  pages: true
})
