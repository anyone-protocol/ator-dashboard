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

        <v-btn
          class="primary-background"
          :loading="loading"
          @click="requestUpdate"
        >Request Update</v-btn>

        <v-btn
          class="primary-background"
          :loading="loading"
          @click="fundOracle"
        >Fund Oracle</v-btn>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { useFacilitator } from '~/composables'

definePageMeta({ middleware: 'auth' })
useHead({ title: 'My Tokens' })

const loading = ref<boolean>(false)
const facilitator = useFacilitator()

const fundOracle = debounce(async () => {
  loading.value = true

  try {
    const success = await facilitator.fundOracle()
    console.log('facilitator fundOracle success', success)
    // TODO -> handle success / failure
  } catch (error) {
    console.error('There was an error while funding oracle', error)
  }

  loading.value = false
})

const requestUpdate = debounce(async () => {
  loading.value = true

  try {
    const success = await facilitator.requestUpdate()
    console.log('facilitator requestUpdate success', success)
    // TODO -> handle success / failure
  } catch (error) {
    console.error('There was an error while requesting update', error)
  }

  loading.value = false
})

const claimTokens = debounce(async () => {
  loading.value = true

  try {
    const success = await facilitator.claim()
    console.log('facilitator claimTokens success', success)
    // TODO -> handle success / failure   
  } catch (error) {
    console.error('There was an error while claiming tokens', error)
  }

  loading.value = false
})

useNuxtApp().$eventBus.on('AllocationUpdated', () => {
  if (loading.value) { loading.value = false }
})

</script>
