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
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-if="!relayRegistryRefreshing && claimable"
              v-for="fingerprint in claimable"
              :key="fingerprint"
            >
              <td><code>{{ fingerprint }}</code></td>
              <td>Claimable</td>
              <td></td>
              <td></td>
              <td></td>
              <td>
                <v-btn
                  @click="claim(fingerprint)"
                  class="primary-background"
                  size="small"
                  :loading="loading"
                >Claim</v-btn>
              </td>
            </tr>

            <tr
              v-if="!relayRegistryRefreshing && verified"
              v-for="relay in verified"
              :key="relay.fingerprint"
            >
              <td><code>{{ relay.fingerprint }}</code></td>
              <td>Verified</td>
              <td class="text-end">
                {{ relay.consensus_weight ? relay.consensus_weight : '--' }}
              </td>
              <td class="text-end">
                {{ relay.observed_bandwidth ? relay.observed_bandwidth : '--' }}
              </td>
              <td class="text-end">
                <v-icon :color="relay.running ? 'green' : 'red'">
                  {{ relay.running ? 'mdi-lan-check' : 'mdi-lan-disconnect' }}
                </v-icon>
              </td>
              <td class="text-end">
                <v-btn
                  @click="openRenounceDialog(relay.fingerprint)"
                  class="danger-background"
                  size="small"
                  :loading="loading"
                >Renounce</v-btn>
              </td>
            </tr>
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
          >Cancel</v-btn>
          <v-spacer />
          <v-btn
            class="primary-background"
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
import BigNumber from 'bignumber.js'

import { useRelayRegistry } from '~/composables'
import { ValidatedRelay, VerificationResultDto } from '~/composables/metrics'
import { Fingerprint } from '~/utils/contracts'

definePageMeta({ middleware: 'auth' })
useHead({ title: 'My Relays' })

const loading = ref<boolean>(false)
const relayRegistryRefreshing = useState<boolean>(
  'relay-registry-refreshing',
  () => true
)

const auth = useAuth()
const claimable = useState<Fingerprint[] | null>('claimableRelays', () => null)
const verifiedRelays = useState<Fingerprint[] | null>(
  'verifiedRelays',
  () => null
)

const relayMetrics = useState<VerificationResultDto[] | null>(
  'relayMetrics',
  () => null
)
const relayMetricsTimestamp = useState<number | null>(
  'relayMetricsTimestamp',
  () => null
)
const timestamp = computed(
  () => relayMetricsTimestamp.value
    && new Date(relayMetricsTimestamp.value)
)

interface HumanizedValidatedRelay
  extends Omit<ValidatedRelay, 'consensus_weight' | 'observed_bandwidth'>
{
  consensus_weight: string
  observed_bandwidth: string
}

const verified = computed(() => {
  if (!auth.value) { return null }
  if (!verifiedRelays.value) { return null }
  if (!relayMetrics.value) { return null }

  return verifiedRelays.value
    .map<Partial<HumanizedValidatedRelay>>(
      fp => {
        const myMetrics = relayMetrics
          .value!
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

    // TODO -> inform user of success, contract state update may be delayed

    if (success) {
      await registry.refresh()
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

    // TODO -> inform user of success, contract state update may be delayed

    if (success) {
      await registry.refresh()
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
