<template>
  <router-link v-slot="{ navigate }" to="/" custom>
    <div class="logo-container" @click="navigate">
      <img src="/images/AtorLogo.png" width="30" height="30">
      <div class="top-bar-title">ATOR</div>
    </div>
  </router-link>
</template>
