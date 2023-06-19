<template>
  <div class="index-page">
    <v-container>
      <v-row>
        <v-col
          v-for="{ key, label, value, icon } in topCards"
          :key="key"
          cols="12"
          sm="6"
          md="6"
          lg="6"
          xl="6"
          xxl="3"
        >
          <v-card class="v-card-ator">
            <v-container>
              <v-row align="center">
                <v-col cols="7">
                  <div class="text-subitle-2 basic-text">
                    {{ label }}
                  </div>
                  <div v-if="!value" class="mt-3">
                    <LoadingBreeze :dots="11" />
                  </div>
                  <div v-else class="text-h5 font-weight-black basic-text">
                    {{ value }}
                  </div>
                </v-col>
                <v-col cols="5" class="text-right">
                  <v-icon :icon="icon" class="icon-ator"></v-icon>
                </v-col>
              </v-row>
            </v-container>
          </v-card>
        </v-col>
      </v-row>
      <v-row v-if="stats && stats.timestamp">
        <v-col cols="12">
          <span class="text-caption">Last Updated: {{ stats.timestamp.toUTCString() }}</span>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<script setup lang="ts">
import { useRelayRegistry } from '~~/composables'

useHead({ title: 'Dashboard' })

const { data: stats } = useLazyAsyncData('ator-stats', async () => {
  const registry = await useRelayRegistry()
  const relays = await registry.verified()
  const relayMetrics = await useRelayMetrics()

  const { validationStats, validationStatsTimestamp: timestamp } = relayMetrics
  const verified = Object.keys(relays)
  const users = verified
    // reduce to relay owner addresses
    .map(fp => relays[fp])
    // ensure user address list is unique
    .filter((addr, i, addrs) => addrs.indexOf(addr) === i)

  return { relays, users, verified, validationStats, timestamp }
})

const topCards = computed(() => {
  const atorRunningObservedBandwidth =
  stats.value?.validationStats?.verified_and_running.observed_bandwidth
  ? (
      stats.value.validationStats.verified_and_running.observed_bandwidth
      / Math.pow(1024, 2)
    ).toFixed(3)
  : ''

  return [
    {
      key: 'total-users',
      label: 'Total Users',
      value: stats.value?.users?.length || '',
      icon: 'mdi-crowd'
    },
    {
      key: 'verified-relays',
      label: 'Verified Relays',
      value: stats.value?.verified?.length || '',
      icon: 'mdi-lifebuoy'
    },
    {
      key: 'active-relays',
      label: 'Active Relays',
      value: stats.value?.validationStats?.verification.running || '',
      icon: 'mdi-transit-connection'
    },
    {
      key: 'observed-bandwidth',
      label: 'Observed Bandwidth',
      value: atorRunningObservedBandwidth ? atorRunningObservedBandwidth + ' MiB/s' : '',
      icon: 'mdi-speedometer'
    }
  ]
})
</script>
