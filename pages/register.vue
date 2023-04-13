<template>
  <v-container class="register-page">
    <v-form>
      <v-text-field
        v-model="fingerprint"
        label="Relay Fingerprint"
        placeholder="AABBCCDDEEFF11223344556677889900AABBCCDD"
      />
      <v-btn @click="register" color="primary">Register</v-btn>
    </v-form>
  </v-container>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Typed, TransactionResponse } from 'ethers'

const fingerprint = ref('')
const loading = ref(false)

// TODO -> debounce
const register = async () => {
  const signer = await useSigner()
  const registry = useRelayRegistry()

  if (registry) {
    loading.value = true

    try {
      // TODO -> strongly typed contract interface
      // @ts-ignore
      const tx: TransactionResponse = registry.connect(signer).registerRelay(
        Typed.string(fingerprint.value)
      )

      await tx.wait()
    } catch (error) {
      console.error(error)
      // TODO -> handle signing errors
      // TODO -> handle api errors
    }

    loading.value = false
  }
}
</script>
