<template>
  <v-container class="my-relays-page">
    <v-row>
      <v-col cols="12">
        <v-table v-if="!pending && myRelays">
          <thead>
            <tr>
              <th class="font-weight-black basic-text">Relay Fingerprint</th>
              <th class="font-weight-black basic-text">Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="fingerprint in myRelays.claimable" :key="fingerprint">
              <td><code>{{ fingerprint }}</code></td>
              <td>Claimable</td>
              <td>
                <v-btn
                  @click="claim(fingerprint)"
                  class="primary-background"
                  size="small"
                  :loading="loading"
                >Claim</v-btn>
              </td>
            </tr>
            <tr v-for="fingerprint in myRelays.verified" :key="fingerprint">
              <td><code>{{ fingerprint }}</code></td>
              <td>Verified</td>
              <td>
                <v-btn
                  @click="openRenounceDialog(fingerprint)"
                  class="danger-background"
                  size="small"
                  :loading="loading"
                >Renounce</v-btn>
              </td>
            </tr>
            <tr v-if="noRelays">
              No pending claimable or verified relays!
            </tr>
          </tbody>
        </v-table>
        <LoadingBreeze v-else />
      </v-col>
    </v-row>

    <v-dialog v-model="isRenounceDialogOpen" width="500">
      <v-card>
        <v-card-title>Renounce Relay</v-card-title>
        <v-card-text>
          <p>
            Are you sure you would like to renounce relay
            <code>{{ renounceFingerprint }}</code>?
          </p>
          <p>
            Type <strong>{{ renouncePhrase }}</strong> below to confirm.
          </p>
          <v-text-field v-model="userTypedRenouncePhrase" />
        </v-card-text>
        <v-card-actions>
          <v-btn
            color="primary-background"
            @click="cancelRenounce"
          >Cancel</v-btn>
          <v-btn
            color="danger-background"
            @click="renounce(renounceFingerprint)"
            :loading="loading"
            :disabled="userTypedRenouncePhrase !== renouncePhrase"
          >Renounce</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup lang="ts">
import { useRelayRegistry } from '~~/composables'

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

const claim = debounce(async (fingerprint: string) => {
  loading.value = true

  const registry = await useRelayRegistry()

  try {
    const success = await registry.claim(fingerprint)

    // TODO -> inform user of success, contract state update may be delayed

    if (success) {
      await refresh()  
    } else {
      console.error('Unknown error interacting with registry contract')
    }
  } catch (error) {
    console.error(error)
  }

  loading.value = false
})

const renounceFingerprint = ref<string | null>(null)
const isRenounceDialogOpen = ref<boolean>(false)
const renouncePhrase = 'I am renouncing my ATOR relay'
const userTypedRenouncePhrase = ref<string>('')
const openRenounceDialog = debounce((fingerprint: string) => {
  renounceFingerprint.value = fingerprint
  isRenounceDialogOpen.value = true
})

const cancelRenounce = () => {
  isRenounceDialogOpen.value = false
}

const renounce = debounce(async (fingerprint: string) => {
  loading.value = true

  const registry = await useRelayRegistry()

  try {
    const success = await registry.renounce(fingerprint)

    // TODO -> inform user of success, contract state update may be delayed

    if (success) {
      await refresh()
      isRenounceDialogOpen.value = false
    } else {
      console.error('Unknown error interacting with registry contract')
    }
  } catch (error) {
    console.error(error)
  }

  loading.value = false
})
</script>
