<template>
  <v-container class="register-page">
    <v-form>
      <v-text-field
        v-model="fingerprint"
        label="Relay Fingerprint"
        placeholder="AABBCCDDEEFF11223344556677889900AABBCCDD"
        :loading="loading"
      />
      <v-btn
        @click="register"
        class="primary-background"
        :loading="loading"
      >Register</v-btn>
    </v-form>
  </v-container>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const fingerprint = ref<string>('')
const loading = ref<boolean>(false)

// TODO -> debounce
const register = async () => {}
// async () => {
//   const signer = await useSigner()
//   const registry = useRelayRegistry()

//   if (registry && signer) {
//     loading.value = true

//     try {
//       const tx = await registry
//         .connect(signer)
//         .registerRelay(fingerprint.value)

//       await tx.wait()

//       // TODO -> success
//     } catch (error) {
//       console.error(error)
//       // TODO -> handle signing errors
//       // TODO -> handle api errors
//     }

//     loading.value = false
//   }
// }
</script>
