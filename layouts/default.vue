<template>
  <v-app class="app">
    <v-app-bar elevation="0">
      <template v-slot:prepend>
        <router-link to="/" custom v-slot="{navigate}">
          <div class="logo-container" @click="navigate">
            <div class="top-bar-title">ATOR</div>
            <img src="/images/AtorLogo.png" width="30" height="30" />
          </div>
        </router-link>
      </template>

      <v-app-bar-title v-if="!smallScreen"><div class="route-title">{{ currentPageTitle }}</div></v-app-bar-title>
      <v-app-bar-title v-if="smallScreen"><div class="route-title" @click="toggleNavDrawer">Hamburger Menu Test</div></v-app-bar-title>

      <template v-slot:append>
        <ClientOnly>
          <ConnectButton />
        </ClientOnly>
      </template>
    </v-app-bar>

    <v-navigation-drawer v-model="navDrawer">
      <v-list>
        <v-list-item
          class="nav-drawer-list-item"
          v-for="{ label, icon, disabled, to } in navItems"
          :key="label"
          :to="to"
          :disabled="disabled"
          :active-class="navDrawerListItemActive"
        >
          <div class="list-item-row-container">
            <v-icon class="list-item-icon" :icon="icon"></v-icon>
            <div class="list-item-row-text">{{label}}</div>
          </div>
        </v-list-item>
      </v-list>
    </v-navigation-drawer>

    <v-main class="app-main">
      <slot />
    </v-main>
  </v-app>
</template>

<style>
@import "@/assets/styles/main.css";
</style>

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
    to: '/my-relays'
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

const smallScreen = computed(() => useSmallScreen().value)

const navDrawerOpen = useNavDrawerOpen()

const toggleNavDrawer = () => {
  navDrawerOpen.value = !navDrawerOpen.value
}

//v-model tries to set navDrawer on render so adding a set: here to suppress the warning that it's readonly
const navDrawer = computed({
  get: () => navDrawerOpen.value,
  set: () => navDrawerOpen.value
})

const navDrawerListItemActive = "nav-drawer-list-item--active"

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
