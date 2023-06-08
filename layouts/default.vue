<template>
  <v-app class="app" v-resize="onResize">
    <TopBar />

    <v-navigation-drawer
      id="nav-drawer"
      v-model="navDrawer"
      :permanent="!smallScreen"
    >
      <v-list v-click-outside="{ handler: closeNavIfSmall, include }">
        <template v-for="{ label, icon, pathToLogo, to, href } in navItems" :key="label">
          <template v-if="to">
            <v-list-item
              class="nav-drawer-list-item"
              :to="to"
              :active-class="navDrawerListItemActive"
            >
              <div class="list-item-row-container">
                <VIconOrImg :icon="icon" :pathToImg="pathToLogo" />
                <div class="list-item-row-text">{{ label }}</div>
              </div>
            </v-list-item>
          </template>
          <template v-else-if="href">
            <v-list-item
              class="nav-drawer-list-item"
              :href="href"
              target="_blank"
            >
              <div class="list-item-row-container">
                <VIconOrImg :icon="icon" :pathToImg="pathToLogo" />
                <div class="list-item-row-text">{{ label }}</div>
                <v-icon
                  size="x-small"
                  class="list-item-icon"
                >mdi-open-in-new</v-icon>
              </div>
            </v-list-item>
          </template>
        </template>
      </v-list>
    </v-navigation-drawer>

    <v-main class="app-main">
      <div v-if="smallScreen" class="route-title-small-screen">
        {{ currentPageTitle }}
      </div>
      <slot />
    </v-main>

    <Footer />

    <WelcomeDialog />
  </v-app>
</template>

<style>
@import "@/assets/styles/main.css";
</style>

<script setup lang="ts">
const navDrawerOpen = useNavDrawerOpen()

/*
  NB: v-navigation-drawer v-model also sets navDrawer so adding a set: here to
      override that
*/
const navDrawer = computed({
  get: () => navDrawerOpen.value,
  set: () => navDrawerOpen.value
})

const navDrawerListItemActive = "nav-drawer-list-item--active"

const include = () => [
  document.getElementById('burger'),
  document.getElementById('nav-drawer')
]
</script>
