<template>
  <v-container>
    <v-row>
      <v-col cols="12">
        <v-card class="v-card-ator" @click="navigateTo('my-tokens')">
          <v-container>
            <v-row align="center">
              <v-col cols="12">
                <v-container>
                  <v-row align="center" justify="space-around">
                    <v-col
                      v-for="{ key, label, value, icon } in myTokensCards"
                      :key="key"
                      class="text-center"
                      cols="12"
                      sm="12"
                      md="4"
                      lg="4"
                      xl="4"
                      xxl="4"
                    >
                      <div
                        class="text-h6 text-lg-h5 basic-text font-weight-bold"
                      >
                        {{ label }}
                      </div>
                      <div
                        v-if="value"
                        class="
                          text-subtitle-2
                          text-lg-h5
                          font-weight-black
                          basic-text
                        "
                      >
                        <code>{{ value }}</code>
                      </div>

                      <LoadingBreeze v-else :dots="5" />
                    </v-col>
                  </v-row>
                </v-container>
              </v-col>
              <!-- <v-col cols="2" class="text-right">
                <v-icon icon="mdi-bank" class="icon-ator"></v-icon>
              </v-col> -->
            </v-row>
          </v-container>

          <v-card-actions v-if="!auth" class="text-right flex-row-reverse">
            <ConnectButton />
          </v-card-actions>

          <!-- <v-card-subtitle v-if="myTokensData">
            <code class="text-caption text-white">
              Last Updated: {{ myTokensData.timestamp }}
            </code>
          </v-card-subtitle> -->
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import BigNumber from 'bignumber.js'

import { useAtorToken, useDistribution, useFacilitator } from '~/composables'

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
  const auth = useAuth()
  if (!auth.value) { return null }
  const facilitator = await useFacilitator()
  if (!facilitator) { return null }
  const atorToken = await useAtorToken()
  if (!atorToken) { return null }

  const distribution = await useDistribution()
  
  // TODO -> use signer.address
  let address = auth.value.address
  address = '0x0A393A0dFc3613eeD5Bd2A0A56d482351f4e3996'
  const humanizedClaimableTokens = await distribution.claimable(address, true)
  const claimableAtomicTokens = await distribution.claimable(address)
  const evmClaimedAtomicTokens = await facilitator
    .getAlreadyClaimedTokens(address)
  const atorTokenBalance = await atorToken.getBalance(address)
  const gasAvailable = await facilitator.getGasAvailable(address)
  console.log('evmClaimedAtomicTokens', evmClaimedAtomicTokens.toString())
  console.log('atorTokenBalance', atorTokenBalance.toString())
  console.log('gasAvailable', gasAvailable.toString())

  return {
    totalLifetimeRewards: `${humanizedClaimableTokens} $ATOR`,
    currentlyClaimableTokens: BigNumber(claimableAtomicTokens)
      .minus(evmClaimedAtomicTokens)
      .dividedBy(10e18)
      .toFormat(4) + ' $ATOR',
    previouslyClaimedTokens: evmClaimedAtomicTokens
      .dividedBy(10e18)
      .toFormat(4) + ' $ATOR',
    timestamp: new Date().toUTCString()
  }
})
const auth = useAuth()
watch(auth, () => myTokensRefresh())
type TokenCards = (StatsCard & { key: string, click?: Function })[]
const myTokensCards = computed((): TokenCards => {
  const auth = useAuth()

  return [
    {
      key: 'lifetime-rewards',
      label: 'My Lifetime Rewards',
      icon: 'mdi-bank',
      value: auth.value && myTokensData.value
        ? myTokensData.value.totalLifetimeRewards
        : auth.value
          ? undefined
          : '--'
    },
    {
      key: 'claimable-rewards',
      label: 'My Claimable Rewards',
      icon: 'mdi-bank',
      value: auth.value && myTokensData.value
        ? myTokensData.value.currentlyClaimableTokens
        : auth.value
          ? undefined
          : '--'
    },
    {
      key: 'previously-claimed',
      label: 'My Previously Claimed',
      icon: 'mdi-bank',
      value: auth.value && myTokensData.value
        ? myTokensData.value.previouslyClaimedTokens
        : auth.value
          ? undefined
          : '--'
    },
  ]
})
</script>
