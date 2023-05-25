<template>
  <v-container class="my-relays-page">
    <v-row>
      <v-col cols="12">
        <v-table v-if="!pending && myRelays">
          <thead>
            <tr>
              <th class="font-weight-black basic-text">Relay Fingerprint</th>
              <th class="font-weight-black basic-text">Status</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="fingerprint in myRelays.claimable" :key="fingerprint">
              <td><code>{{ fingerprint }}</code></td>
              <td>
                <v-btn
                  @click="claim(fingerprint)"
                  class="primary-background"
                  :loading="loading"
                >Claim</v-btn>
              </td>
            </tr>
            <tr v-for="fingerprint in myRelays.verified" :key="fingerprint">
              <td><code>{{ fingerprint }}</code></td>
              <td>{{ 'Verified' }}</td>
            </tr>
            <tr v-if="noRelays">
              No pending claimable or verified relays!
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
import _ from 'lodash'

definePageMeta({ middleware: 'auth' })
useHead({ title: 'My Relays' })

const loading = ref<boolean>(false)

const {
  pending,
  data: myRelays,
  refresh
} = useLazyAsyncData('my-relays', async () => {
  const registry = await useRelayRegistry()
  const signer = await useSigner()

  if (registry && signer) {
    try {
      const claimable = await registry.claimable(signer.address)
      const verified = await registry.verified(signer.address)

      return { claimable, verified }
    } catch (error) {
      console.log('error reading relay registry contract', error)
    }
  }

  return null
})

const noRelays = computed(() => {
  if (myRelays.value) {
    return myRelays.value.claimable.length === 0
      && myRelays.value.verified.length === 0
  }

  return true
})

const claim = _.debounce(async (fingerprint: string) => {
  loading.value = true

  const registry = await useRelayRegistry()

  try {
    const success = await registry.claim(fingerprint)

    // TODO -> inform user of success, state update may be delayed

    if (success) {
      await refresh()  
    } else {
      console.error('Unknown error interacting with registry contract')
    }
  } catch (error) {
    console.error(error)
  }

  loading.value = false
}, 300, { leading: true, trailing: false })
</script>
