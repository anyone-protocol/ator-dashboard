<template>
  <v-container class="my-relays-page h-100">
    <v-row>
      <MyTokenStats />
    </v-row>
    <v-row>
      <v-col cols="12" class="text-center">
        <v-btn class="primary-background">Claim Tokens</v-btn>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
definePageMeta({ middleware: 'auth' })
useHead({ title: 'My Tokens' })
</script>
