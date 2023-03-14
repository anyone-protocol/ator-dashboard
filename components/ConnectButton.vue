<template>
  <v-btn v-if="auth" @click="disconnect">Disconnect</v-btn>
  <v-btn v-else @click="connect">Connect</v-btn>
</template>

<script setup lang="ts">
const auth = useAuth()

const connect = () => { auth.value = true }
const disconnect = () => { auth.value = false }
</script>
