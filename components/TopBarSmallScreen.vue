<template>
    <v-app-bar elevation="0">
        <template v-slot:prepend>
            <v-icon color="accent" :icon="useNavDrawerOpen().value ? 'mdi-close' : 'mdi-menu'" @click="toggleNavDrawer"></v-icon>
        </template>

        <TitleAndLogo />

        <template v-slot:append>
            <ClientOnly>
                <ConnectButton />
            </ClientOnly>
        </template>
    </v-app-bar>
</template>