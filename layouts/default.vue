<template>
  <v-app class="app">
    <v-app-bar elevation="0">
      <template v-slot:prepend>
        <v-btn text tile plain color="black">AIRTOR</v-btn>
      </template>

      <v-app-bar-title><div class="route-title font-weight-bold">{{ currentPageTitle }}</div></v-app-bar-title>

      <template v-slot:append>
        <ClientOnly>
          <ConnectButton />
        </ClientOnly>
      </template>
    </v-app-bar>

    <v-navigation-drawer>
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
  .route-title {
    margin-left: 160px;
    color: rgba(0, 0, 0, 0.777);
  }
  .primary-light-1-background {
    background: rgb(var(--v-theme-primary-light-1));
    color: white;
  }

  .nav-drawer-list-item {
    color: white;
  }
  .nav-drawer-list-item--active {
    background-color: white;
    color: white;
    box-shadow: inset -15px 0 0 -10px rgb(var(--v-theme-primary));
  }
  .nav-drawer-list-item:hover {
    background-color: rgba(var(--v-theme-primary), 0.05);
  }

  .list-item-row-container {
    display: flex;
    flex-direction: row;
    justify-content: flex-start;
    text-align: center;
    align-items: center;
  }
  .list-item-row-text {
    color: rgba(0, 0, 0, 0.94);
    margin-left: 15%;
  }
  .nav-drawer-list-item--active .list-item-row-text {
    color: rgb(var(--v-theme-primary));
  }
  .list-item-icon {
    color: rgba(0, 0, 0, 0.94);
  }
  .nav-drawer-list-item--active .list-item-icon {
    color: rgb(var(--v-theme-primary));
  }
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

const navDrawerListItemActive = ref("nav-drawer-list-item--active");

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
