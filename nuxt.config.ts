// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  ssr: false,

  app: {
    baseURL: '/',
    head: {
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        {
          hid: 'description',
          name: 'Description',
          content: 'ATOR Dashboard'
        },
        { property: 'og:site_name', content: 'ATOR Dashboard' },
        { name: 'twitter:site', content: '@atorprotocol' }
      ],
      link: [{
        rel: 'icon',
        type: 'image/png',
        href: '/images/AtorLogo.png'
      }]
    }
  },

  experimental: {
    writeEarlyHints: false
  },

  /**
   * Runtime Config
   */
  runtimeConfig: {
    public: {
      relayRegistryAddress: 'R5PXlkYsP5HYVCzGhF9xzZXQqBog3KrRchp47aa5e3w',
      metricsDeployer: 'guDw5nBzO2zTpuYMnxkSpQ2qCQjL8gxB34GjPpZ2qpY',
      phase: 'dev'
    },
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
