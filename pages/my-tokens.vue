<template>
  <v-container class="my-relays-page h-100">
    <v-row class="h-100">
      <v-col cols="12" class="h-100">
        <div v-if="!pending && data">
          <v-table>
            <thead>
              <tr>
                <th class="font-weight-black basic-text">
                  Lifetime Rewards
                </th>
                <th class="font-weight-black basic-text">
                  Claimable Tokens
                </th>
                <th class="font-weight-black basic-text">
                  Previously Claimed Tokens
                </th>
              </tr>
            </thead>

            <tbody>
              <tr>
                <td><code>{{ data.totalLifetimeRewards }} $ATOR</code></td>
                <td><code>{{ data.currentlyClaimableTokens }} $ATOR</code></td>
                <td><code>{{ data.previouslyClaimedTokens }} $ATOR</code></td>
              </tr>
            </tbody>
          </v-table>
        </div>

        <div v-else class="center-loading-splash">
          <LoadingBreeze :dots="7" size="large" />
        </div>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import BigNumber from 'bignumber.js'

import { useDistribution } from '~/composables'

definePageMeta({ middleware: 'auth' })
useHead({ title: 'My Tokens' })

const { pending, data, refresh } = useLazyAsyncData('my-tokens', async () => {
  const distribution = await useDistribution()
  if (!distribution) { return null }
  const signer = await useSigner()
  if (!signer) { return null }

  try {
    // TODO -> use signer.address
    // const address = signer.address
    const address = '0x0A393A0dFc3613eeD5Bd2A0A56d482351f4e3996'
    const humanizedClaimableTokens = await distribution.claimable(address, true)
    const claimableAtomicTokens = await distribution.claimable(address)
    const evmClaimedAtomicTokens = '0' // TODO -> from Facilit-ator :)

    return {
      totalLifetimeRewards: humanizedClaimableTokens,
      currentlyClaimableTokens: BigNumber(claimableAtomicTokens)
        .minus(evmClaimedAtomicTokens)
        .dividedBy(10e18)
        .toFormat(4),
      previouslyClaimedTokens: BigNumber(evmClaimedAtomicTokens)
        .dividedBy(10e18)
        .toFormat(4)
    }
  } catch (error) {
    console.error('Error reading distribution contract', error)
  }
})

</script>
