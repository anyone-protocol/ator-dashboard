<template>
  <div class="index-page">
    <v-container>
      <v-row>
        <MyTokenStats />
      </v-row>

      <br>
      <br>

      <v-row>
        <v-col cols="12">
          <h1>Network Stats</h1>
        </v-col>
      </v-row>

      <v-row>
        <v-col
          v-for="{ key, label, value, icon } in networkStatsCards"
          :key="key"
          cols="12"
          sm="6"
          md="6"
          lg="6"
          xl="6"
          xxl="3"
        >
          <StatsCard :label="label" :value="value" :icon="icon" />
        </v-col>
      </v-row>
      <v-row v-if="timestamp">
        <v-col cols="12">
          <span class="text-caption">
            Last Updated: {{ timestamp.toUTCString() }}
          </span>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<script setup lang="ts">
import BigNumber from 'bignumber.js'

import { RelayRegistryState } from '~/composables'
import { useMetricsStore } from '~/stores/metrics'

useHead({ title: 'Dashboard' })

const metrics = useMetricsStore()

const totalVerifiedRelays = useState<RelayRegistryState['verified'] | null>(
  'totalVerifiedRelays',
  () => null
)
const users = computed(() => {
  if (!totalVerifiedRelays.value) { return [] }

  return verified.value
    // reduce to relay owner addresses
    .map(fp => totalVerifiedRelays.value![fp])
    // ensure user address list is unique
    .filter((addr, i, addrs) => addrs.indexOf(addr) === i)
})
const verified = computed(() => {
  if (!totalVerifiedRelays.value) { return [] }
  
  return Object.keys(totalVerifiedRelays.value)
})
const timestamp = computed(
  () => metrics.validation.timestamp && new Date(metrics.validation.timestamp)
)
const atorBandwidth = computed(() => {
  if (!metrics.validation.latest) { return null }

  const bandwidth = metrics
    .validation
    .latest
    .verified_and_running
    .observed_bandwidth

  return BigNumber(bandwidth)
    .dividedBy(Math.pow(1024, 2))
    .toFormat(3) + ' MiB/s'
})
const networkStatsCards = computed(() => {
  const totalUsers = users.value.length || ''
  const verifiedRelays = verified.value.length || ''
  const activeRelays = metrics.validation.latest?.verification.running || ''
  const observedBandwidth = atorBandwidth.value || ''

  return [
    {
      key: 'total-users',
      label: 'Total Users',
      value: totalUsers,
      icon: 'mdi-crowd'
    },
    {
      key: 'verified-relays',
      label: 'Verified Relays',
      value: verifiedRelays,
      icon: 'mdi-lifebuoy'
    },
    {
      key: 'active-relays',
      label: 'Active Relays',
      value: activeRelays,
      icon: 'mdi-transit-connection'
    },
    {
      key: 'observed-bandwidth',
      label: 'Observed Bandwidth',
      value: observedBandwidth,
      icon: 'mdi-speedometer'
    }
  ]
})
</script>
