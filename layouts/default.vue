<template>
  <v-app class="app">
    <v-app-bar elevation="0">
      <template v-slot:prepend>
        <v-btn text tile plain color="black">AIRTOR</v-btn>
      </template>

      <v-app-bar-title>{{ currentPageTitle }}</v-app-bar-title>

      <template v-slot:append>
        <!-- <v-btn>connect</v-btn> -->
      </template>
    </v-app-bar>

    <v-navigation-drawer>
      <v-list>
        <v-list-item
          v-for="{ label, icon, disabled, to } in navItems"
          :key="label"
          :title="label"
          :prepend-icon="icon"
          :to="to"
          :disabled="disabled"
        ></v-list-item>
      </v-list>
    </v-navigation-drawer>

    <v-main class="app-main">
      <slot />
    </v-main>
  </v-app>
</template>

<script setup lang="ts">
const route = useRoute()

const navItems = ref([
  {
    label: 'Dashboard',
    icon: 'mdi-speedometer',
    to: '/'
  },
  {
    label: 'My Relays',
    icon: 'mdi-lifebuoy',
    to: '/my-relays',
    disabled: true
  },
  {
    label: 'Register',
    icon: 'mdi-clipboard-edit-outline',
    to: '/register'
  },
  {
    label: 'Purchase',
    icon: 'mdi-ethereum',
    to: '/purchase',
    disabled: true
  }
])

const currentPageTitle = computed(() => {
  const currentNavItem = navItems.value.find(item => {
    if (route.name === item.to.substring(1)) {
      return true
    }
    
    if (route.name === 'index' && item.to === '/') {
      return true
    }

    return false
  })
  
  return currentNavItem ? currentNavItem.label : ''
})
</script>
