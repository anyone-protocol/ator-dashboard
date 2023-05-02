<template>
    <v-app-bar elevation="0">
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