<template>
  <v-app class="app">
    <TopBar v-if="!smallScreen" />
    <TopBarSmallScreen v-if="smallScreen" />

    <v-navigation-drawer v-model="navDrawer" :permanent="!smallScreen">
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
      <div v-if="smallScreen" class="route-title-small-screen">{{ currentPageTitle }}</div>
      <slot />
    </v-main>
  </v-app>
</template>

<style>
  @import "@/assets/styles/main.css";
</style>

<script setup lang="ts">
  const smallScreen = computed(() => useSmallScreen().value)

  const navDrawerOpen = useNavDrawerOpen()

  //v-model tries to set navDrawer on render so adding a set: here to suppress the warning that it's readonly
  const navDrawer = computed({
    get: () => navDrawerOpen.value,
    set: () => navDrawerOpen.value
  })

  const navDrawerListItemActive = "nav-drawer-list-item--active"
</script>
