<template>
  <v-container class="register-page">
    <v-form>
      <v-text-field v-model="fingerprint" label="Relay Fingerprint" />
      <v-btn @click="register" color="primary">Register</v-btn>
    </v-form>
  </v-container>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const fingerprint = ref('')
const loading = ref(false)

// TODO -> debounce
const register = async () => {
  const config = useRuntimeConfig()
  const signer = await useSigner()

  if (signer) {
    loading.value = true

    try {
      const message = {
        method: 'register',
        address: signer.address,
        fingerprint: fingerprint.value
      }
      const signature = await signer.signMessage(JSON.stringify(message))

      const res = await $fetch(`${config.public.api}/relays`, {
        method: 'POST',
        query: { address: signer.address, signature },
        body: message
      })

      console.log('res', res)
    } catch (error) {
      console.error(error)
      // TODO -> handle signing errors
      // TODO -> handle api errors
    }

    loading.value = false
  }
}
</script>
