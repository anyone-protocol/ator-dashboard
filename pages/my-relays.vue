<template>
  <v-container class="my-relays-page h-100">
    <v-row class="h-100">
      <v-col cols="12" class="h-100">
        <v-table>
          <thead>
            <tr>
              <th class="font-weight-black basic-text">Relay Fingerprint</th>
              <th class="font-weight-black basic-text">Status</th>
              <th class="font-weight-black basic-text text-right">
                Consensus Weight
              </th>
              <th class="font-weight-black basic-text text-right">
                Observed Bandwidth
              </th>
              <th class="font-weight-black basic-text text-right">Active</th>
              <th />
            </tr>
          </thead>
          <tbody>
            <template v-if="!relayRegistryRefreshing && claimable">
              <tr
                v-for="fingerprint in claimable"
                :key="fingerprint"
              >
                <td><code>{{ fingerprint }}</code></td>
                <td>Claimable</td>
                <td />
                <td />
                <td />
                <td>
                  <v-btn
                    class="primary-background"
                    size="small"
                    :loading="loading"
                    @click="claim(fingerprint)"
                  >
                    Claim
                  </v-btn>
                </td>
              </tr>
            </template>

            <template v-if="!relayRegistryRefreshing && verified">
              <tr
                v-for="relay in verified"
                :key="relay.fingerprint"
              >
                <td><code>{{ relay.fingerprint }}</code></td>
                <td>Verified</td>
                <td class="text-end">
                  {{ relay.consensus_weight ? relay.consensus_weight : '--' }}
                </td>
                <td class="text-end">
                  {{
                    relay.observed_bandwidth
                      ? relay.observed_bandwidth
                      : '--'
                  }}
                </td>
                <td class="text-end">
                  <v-icon :color="relay.running ? 'green' : 'red'">
                    {{ relay.running ? 'mdi-lan-check' : 'mdi-lan-disconnect' }}
                  </v-icon>
                </td>
                <td class="text-end">
                  <v-btn
                    class="danger-background"
                    size="small"
                    :loading="loading"
                    @click="openRenounceDialog(relay.fingerprint)"
                  >
                    Renounce
                  </v-btn>
                </td>
              </tr>
            </template>
            
            <tr v-if="!relayRegistryRefreshing && !hasRelays">
              <td>No pending claimable or verified relays!</td>
            </tr>

            <div v-if="relayRegistryRefreshing" class="center-loading-splash">
              <LoadingBreeze :dots="7" size="large" />
            </div>
          </tbody>
          <tfoot>
            <tr v-if="timestamp">
              <td colspan="6">
                <span class="text-caption">
                  Last Updated: {{ timestamp.toUTCString() }}
                </span>
              </td>
            </tr>
          </tfoot>
        </v-table>
      </v-col>
    </v-row>

    <v-dialog v-model="isRenounceDialogOpen">
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
            class="danger-background"
            @click="cancelRenounce"
          >
            Cancel
          </v-btn>
          <v-spacer />
          <v-btn
            class="primary-background"
            :loading="loading"
            :disabled="userTypedRenouncePhrase !== renouncePhrase"
            @click="renounce(renounceFingerprint)"
          >
            Renounce
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-snackbar v-model="snackbarOpen" vertical :color="snackbarType">
      <div class="text-subtitle-1 pb-2">{{ snackbarTitle }}</div>
      <p>{{ snackbarMessage }}</p>  
      <template #actions>
        <v-btn
          color="white"
          variant="text"
          @click="snackbarOpen = false"
        >
          Close
        </v-btn>
      </template>
    </v-snackbar>
  </v-container>
</template>

<script setup lang="ts">
import BigNumber from 'bignumber.js'

import { useRelayRegistry } from '~/composables'
import { HumanizedValidatedRelay, useMetricsStore } from '~/stores/metrics'
import { Fingerprint } from '~/utils/contracts'
import Logger from '~/utils/logger'

definePageMeta({ middleware: 'auth' })
useHead({ title: 'My Relays' })

const logger = new Logger('my-relays.vue')
const snackbarOpen = ref(false)
const snackbarMessage = ref('')
const snackbarType = ref<'success' | 'error'>('success')
const snackbarTitle = ref('')
const showSnackbarMessage = (type: 'success' | 'error', message: string) => {
  snackbarType.value = type
  snackbarTitle.value = type === 'success' ? 'Success' : 'Error'
  snackbarMessage.value = message
  snackbarOpen.value = true
}

const loading = ref<boolean>(false)
const relayRegistryRefreshing = useState<boolean>(
  'relay-registry-refreshing',
  () => true
)

const auth = useAuth()
const metrics = useMetricsStore()
const claimable = useState<Fingerprint[] | null>('claimableRelays', () => null)
const verifiedRelays = useState<Fingerprint[] | null>(
  'verifiedRelays',
  () => null
)
const timestamp = computed(
  () => metrics.relays.timestamp && new Date(metrics.relays.timestamp)
)

const verified = computed(() => {
  if (!auth.value) { return null }
  if (!verifiedRelays.value) { return null }
  if (!metrics.relays.latest) { return null }

  return verifiedRelays.value
    .map<Partial<HumanizedValidatedRelay>>(
      fp => {
        const myMetrics = metrics.relays.latest!
          .find(({ relay }) => fp === relay.fingerprint)
        const relay = myMetrics ? myMetrics.relay : null

        return relay
          ? {
            ...relay,
            consensus_weight: BigNumber(relay.consensus_weight)
              .toFormat(),
            observed_bandwidth: BigNumber(relay.observed_bandwidth)
              .dividedBy(Math.pow(1024, 2))
              .toFormat(3) + ' MiB/s'
          }
          : { fingerprint: fp }
      }
    )
})

const hasRelays = computed(() => {
  const hasClaimableRelays = claimable.value
    && claimable.value.length > 0
  const hasVerifiedRelays = verifiedRelays.value
    && verifiedRelays.value.length > 0

  return hasClaimableRelays || hasVerifiedRelays
})

const claim = debounce(async (fingerprint: string) => {
  loading.value = true

  const registry = useRelayRegistry()

  try {
    const success = await registry.claim(fingerprint)

    if (success) {
      showSnackbarMessage(
        'success',
        `Successfully claimed relay ${fingerprint}!`
      )
      await registry.refresh()
    } else {
      throw new Error('Unknown error interacting with registry contract')
    }
  } catch (error) {
    let message = 'See console for error'
    if (error instanceof Error) {
      message = error.message
    }
    showSnackbarMessage(
      'error',
      `An error occurred claiming relay ${fingerprint}: ${message}`
    )
    logger.error(error)
  }

  loading.value = false
})

const renounceFingerprint = ref<string | null>(null)
const isRenounceDialogOpen = ref<boolean>(false)
const baseRenouncePhrase = 'I am renouncing fingerprint'
const renouncePhrase = ref<string>(baseRenouncePhrase)
const userTypedRenouncePhrase = ref<string>('')
const openRenounceDialog = debounce((fingerprint: string) => {
  renounceFingerprint.value = fingerprint
  renouncePhrase.value = `${baseRenouncePhrase} ${fingerprint}`
  isRenounceDialogOpen.value = true
})

const cancelRenounce = () => {
  isRenounceDialogOpen.value = false
}

const renounce = debounce(async (fingerprint: string) => {
  loading.value = true

  const registry = useRelayRegistry()

  try {
    const success = await registry.renounce(fingerprint)

    if (success) {
      isRenounceDialogOpen.value = false
      showSnackbarMessage(
        'success',
        `Successfully renounced relay ${fingerprint}!`
      )
      await registry.refresh()
      
    } else {
      throw new Error('Unknown error interacting with registry contract')
    }
  } catch (error) {
    let message = 'See console for error'
    if (error instanceof Error) {
      message = error.message
    }
    showSnackbarMessage(
      'error',
      `An error occurred renouncing relay ${fingerprint}: ${message}`
    )
    logger.error(error)
  }

  loading.value = false
})
</script>
