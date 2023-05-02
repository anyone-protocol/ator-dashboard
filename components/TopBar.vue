<template>
    <v-app-bar v-if="smallScreen" elevation="0">
        <template v-slot:prepend>
            <v-icon id="burger" color="accent" :icon="useNavDrawerOpen().value ? 'mdi-close' : 'mdi-menu'" @click="toggleNavDrawer"></v-icon>
        </template>

        <TitleAndLogo />

        <template v-slot:append>
            <ClientOnly>
                <ConnectButton />
            </ClientOnly>
        </template>
    </v-app-bar>

    <v-app-bar v-else elevation="0">
        <template v-slot:prepend>
            <TitleAndLogo />
        </template>

        <v-app-bar-title><div class="route-title">{{ currentPageTitle }}</div></v-app-bar-title>

        <template v-slot:append>
            <ClientOnly>
                <ConnectButton />
            </ClientOnly>
        </template>
    </v-app-bar>
</template>
