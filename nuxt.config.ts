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
      // TODO -> relayRegistryAddress: 'R5PXlkYsP5HYVCzGhF9xzZXQqBog3KrRchp47aa5e3w',
      relayRegistryAddress: 'LYtr_ztHqd4nFFSZyYN9_BWIinESJNBVzOJwo1u5dU0',
      metricsDeployer: 'guDw5nBzO2zTpuYMnxkSpQ2qCQjL8gxB34GjPpZ2qpY',
      distributionContract: 'WysKExOUoAhMuclQsmd46_D8AtxzkhYhTMdeGZ8JwLY',
      facilitatorContract: '0xf133cA3F076C84872E6AaD2d0FB815B9196c35C2',
      goerliAtorTokenContract: '0x639683be73c27202faa061496d72687db93e9dde',
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
