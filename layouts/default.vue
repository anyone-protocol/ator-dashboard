<template>
  <v-app class="app" v-resize="onResize">
    <TopBar />

    <v-navigation-drawer id="nav-drawer" v-model="navDrawer" :permanent="!smallScreen">
      <v-list v-click-outside="{handler: closeNavIfSmall, include}">
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

    <Footer />
  </v-app>
</template>

<style>
@import "@/assets/styles/main.css";
</style>

<script setup lang="ts">
const navDrawerOpen = useNavDrawerOpen()

//v-navigation-drawer v-model also sets navDrawer so adding a set: here to override that
const navDrawer = computed({
  get: () => navDrawerOpen.value,
  set: () => navDrawerOpen.value
})

const navDrawerListItemActive = "nav-drawer-list-item--active"

const include = () => [document.getElementById('burger'), document.getElementById('nav-drawer')]
</script>
