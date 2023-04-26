<template>
  <v-container class="my-relays-page">
    <v-form>
      <v-text-field
        v-model="fingerprint"
        label="Relay Fingerprint"
        :loading="loading"
      ></v-text-field>
      <v-text-field
        v-model="claimedBy"
        label="Claimed By Address"
        :loading="loading"
      ></v-text-field>
      <v-btn
        @click="verify"
        color="primary"
        :loading="loading"
      >Register</v-btn>
    </v-form>
  </v-container>
</template>

<script setup lang="ts">
const fingerprint = ref('')
const claimedBy = ref('')
const loading = ref(false)

// TODO -> debounce
const verify = async () => {
  const signer = await useSigner()
  const registry = await useRelayRegistry()

  if (registry && signer) {
    loading.value = true

    try {
      const success = await registry.verify(
        claimedBy.value,
        fingerprint.value
      )

      // TODO -> success
    } catch (error) {
      console.error(error)
      // TODO -> handle signing errors
      // TODO -> handle api errors
    }

    loading.value = false
  }
}
</script>
