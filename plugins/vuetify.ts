import { createVuetify, ThemeDefinition } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'

const primaryATORTheme: ThemeDefinition = {
  dark: false,
  colors: {
    //ator colors
    primary: '#03bec5',
    'primary-2': '#025675',
    'primary-3': '#025d66',
    //extra colors
    background: '#FFFFFF',
    surface: '#FFFFFF',
    'lightblue-1': '#71d0fb',
    'lightblue-2': '#4FC3F7',
    secondary: '#0fc0b0',
    'secondary-darken-1': '#0ba698',
    accent: '#0C2572',
    error: '#FF5252',
    info: '#2196F3',
    success: '#4CAF50',
    warning: '#FFC107',
  }
}

export default defineNuxtPlugin(nuxtApp => {
  const vuetify = createVuetify({
    ssr: true,
    components,
    directives,
    theme: {
      defaultTheme: 'primaryATORTheme',
      themes: {
        primaryATORTheme,
      }
    }
  })

  nuxtApp.vueApp.use(vuetify)
})
