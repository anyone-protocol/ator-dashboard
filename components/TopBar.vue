<template>
  <v-app-bar v-if="smallScreen" elevation="0">
    <template #prepend>
      <v-icon
        id="burger"
        color="accent"
        :icon="useNavDrawerOpen().value ? 'mdi-close' : 'mdi-menu'"
        @click="toggleNavDrawer"
      />
    </template>

    <TitleAndLogo />

    <template #append>
      <ConnectButton />
    </template>
  </v-app-bar>

  <v-app-bar v-else elevation="0">
    <template #prepend>
      <TitleAndLogo />
    </template>

    <v-app-bar-title>
      <div class="route-title">{{ currentPageTitle }}</div>
    </v-app-bar-title>

    <template #append>
      <ConnectButton />
    </template>
  </v-app-bar>
</template>
