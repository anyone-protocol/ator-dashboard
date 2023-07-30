<template>
  <div class="index-page">
    <v-container>
      <v-row>
        <v-col
          v-for="{ key, label, value, icon } in myTokensCards"
          :key="key"
          cols="12"
          sm="4"
          md="4"
          lg="4"
          xl="4"
          xxl="4"
        >
          <StatsCard :label="label" :value="value" :icon="icon" requires-auth />
        </v-col>
      </v-row>

      <v-row v-if="myTokensData && myTokensData.timestamp">
        <v-col cols="12">
          <span class="text-caption">
            Last Updated: {{ myTokensData.timestamp }}
          </span>
        </v-col>
      </v-row>

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
          <StatsCard :label="label" :value="value" :icon="icon" />
        </v-col>
      </v-row>
      <v-row v-if="stats && stats.timestamp">
        <v-col cols="12">
          <span class="text-caption">
            Last Updated: {{ stats.timestamp.toUTCString() }}
          </span>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<script setup lang="ts">
import BigNumber from 'bignumber.js'

import { useDistribution, useRelayRegistry } from '~/composables'

useHead({ title: 'Dashboard' })

type StatsCard = {
  label: string
  icon: string
  value?: string | number
}

const {
  pending: myTokensPending,
  data: myTokensData,
  refresh: myTokensRefresh
} = useLazyAsyncData('my-tokens', async () => {
  const provider = useProvider()
  const auth = useAuth()
  console.log('index.vue auth', auth.value)
  if (!auth.value) { return null }

  const distribution = await useDistribution()
  
  // TODO -> use signer.address
  let address = auth.value.address
  address = '0x0A393A0dFc3613eeD5Bd2A0A56d482351f4e3996'
  const humanizedClaimableTokens = await distribution.claimable(address, true)
  const claimableAtomicTokens = await distribution.claimable(address)
  const evmClaimedAtomicTokens = '0' // TODO -> from Facilit-ator :)

  return {
    totalLifetimeRewards: `${humanizedClaimableTokens} $ATOR`,
    currentlyClaimableTokens: BigNumber(claimableAtomicTokens)
      .minus(evmClaimedAtomicTokens)
      .dividedBy(10e18)
      .toFormat(4) + ' $ATOR',
    previouslyClaimedTokens: BigNumber(evmClaimedAtomicTokens)
      .dividedBy(10e18)
      .toFormat(4) + ' $ATOR',
    timestamp: new Date().toUTCString()
  }
})
const auth = useAuth()
watch(auth, () => myTokensRefresh())
const myTokensCards = computed((): (StatsCard & { key: string })[] => {
  const auth = useAuth()

  return [
    {
      key: 'lifetime-rewards',
      label: 'Lifetime Rewards',
      icon: 'mdi-bank',
      value: auth.value && myTokensData.value?.totalLifetimeRewards
    },
    {
      key: 'claimable-rewards',
      label: 'Claimable Rewards',
      icon: 'mdi-bank',
      value: auth.value && myTokensData.value?.currentlyClaimableTokens
    },
    {
      key: 'previously-claimed',
      label: 'Previously Claimed',
      icon: 'mdi-bank',
      value: auth.value && myTokensData.value?.previouslyClaimedTokens
    },
  ]
})

const {
  pending,
  data: stats,
  refresh
} = useLazyAsyncData('ator-stats', async () => {
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
        stats.value?.validationStats.verified_and_running.observed_bandwidth
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
      value: atorRunningObservedBandwidth
        ? BigNumber(atorRunningObservedBandwidth).toFormat(3) + ' MiB/s'
        : '',
      icon: 'mdi-speedometer'
    }
  ]
})
</script>
