<template>
    <router-link to="/" custom v-slot="{navigate}">
        <div class="logo-container" @click="navigate">
            <div class="top-bar-title">ATOR</div>
            <img src="/images/AtorLogo.png" width="30" height="30" />
        </div>
    </router-link>
</template>