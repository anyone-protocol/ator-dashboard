<template>
  <v-container class="my-relays-page h-100">
    <v-row>
      <MyTokenStats />
    </v-row>
    <v-row>
      <v-col cols="12" class="text-center">
        <v-btn
          class="primary-background"
          :loading="loading"
          @click="claimTokens"
        >Claim Tokens</v-btn>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { useFacilitator } from '~/composables'

definePageMeta({ middleware: 'auth' })
useHead({ title: 'My Tokens' })

const loading = ref<boolean>(false)

const claimTokens = debounce(async () => {
  loading.value = true

  const facilitator = await useFacilitator()
  if (!facilitator) { loading.value = false; return null }

  try {
    const success = await facilitator.claim()
    
  } catch (error) {
    console.error('There was an unexpected error while claiming tokens', error)
    loading.value = false
  }
})

useNuxtApp().$eventBus.on('AllocationUpdated', () => {
  if (loading.value) { loading.value = false }
})

</script>
