<template>
  <v-container class="my-relays-page">
    <v-row>
      <v-col cols="12">
        <v-table v-if="!pending && myRelays">
          <thead>
            <tr>
              <th class="font-weight-black">Relay Fingerprint</th>
              <th class="font-weight-black">Status</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="fingerprint in myRelays.claims" :key="fingerprint">
              <td><code>{{ fingerprint }}</code></td>
              <td>{{ 'Pending Verification' }}</td>
            </tr>
            <tr v-for="fingerprint in myRelays.verified" :key="fingerprint">
              <td><code>{{ fingerprint }}</code></td>
              <td>{{ 'Verified' }}</td>
            </tr>
            <tr v-if="noRelays">
              No pending claims or verified relays!
            </tr>
          </tbody>
        </v-table>
        <div v-else>
          Loading...
        </div>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: 'auth'
})

const { pending, data: myRelays } = useLazyAsyncData('my-relays', async () => {
  const registry = await useRelayRegistry()
  const signer = await useSigner()

  if (registry && signer) {
    try {
      const claims = await registry.claims(signer.address)
      const verified = await registry.verified(signer.address)

      return { claims, verified }
    } catch (error) {
      console.log('error reading relay registry contract', error)
    }
  }

  return null
})

const noRelays = computed(() => {
  if (myRelays.value) {
    return myRelays.value.claims.length === 0
      && myRelays.value.verified.length === 0
  }

  return true
})
</script>
