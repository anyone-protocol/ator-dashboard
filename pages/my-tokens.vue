<template>
  <v-container class="my-relays-page h-100">
    <v-row>
      <MyTokenStats />
    </v-row>

    <v-row justify="center">
      <v-col cols="6" class="text-center">
        <v-alert v-model="hasError" type="error" closable :icon="false">
          Error claiming tokens!
        </v-alert>

        <v-card>
          <v-card-text>
            <p v-if="hasTokensToClaim && !facilitatorStore.hasPendingClaim">
              You have
              <code>{{ currentlyClaimableTokens }} $ATOR (Goerli Test)</code>
              &nbsp;<strong>ready to claim</strong>!
            </p>
            <p v-else-if="facilitatorStore.hasPendingClaim">
              You have a <strong>pending claim</strong> for 
              <code>{{ currentlyClaimableTokens }} $ATOR (Goerli Test)</code>
            </p>
            <p v-else><strong>No tokens</strong> to claim!</p>
          </v-card-text>

          <v-card-actions class="claim-card-actions" v-if="hasTokensToClaim && !facilitatorStore.hasPendingClaim">
            <v-btn
              class="primary-background"
              :loading="loading"
              :disabled="facilitatorStore.hasPendingClaim"
              @click="onClaimClicked"
            >
              Claim Tokens
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>

    <v-row justify="center">
      <v-col cols="12">
        <v-table>
          <thead>
            <tr>
              <th class="font-weight-black basic-text">Claim</th>
              <th class="font-weight-black basic-text">Request Tx</th>
              <th class="font-weight-black basic-text">Request Timestamp</th>
              <th class="font-weight-black basic-text">Claim Tx</th>
              <th class="font-weight-black basic-text">Claim Timestamp</th>
              <th class="font-weight-black basic-text">Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="claim in facilitatorStore.claimLog"
              :key="claim.claimNumber"
            >
              <td class="text-center">{{ claim.claimNumber }}</td>
              <td>
                <a
                  v-if="claim.requestingUpdateTransactionHash"
                  target="_blank"
                  :href="etherscanUrl(claim.requestingUpdateTransactionHash)"
                >
                  <code>
                    {{ truncatedHash(claim.requestingUpdateTransactionHash) }}
                  </code>
                </a>
              </td>
              <td><code>{{ claim.requestingUpdateBlockTimestamp }}</code></td>
              <td>
                <a
                  v-if="claim.allocationClaimedTransactionHash"
                  target="_blank"
                  :href="etherscanUrl(claim.allocationClaimedTransactionHash)"
                >
                  <code>
                    {{ truncatedHash(claim.allocationClaimedTransactionHash) }}
                  </code>
                </a>
                <code v-else>Pending</code>
              </td>
              <td>
                <code v-if="claim.allocationClaimedBlockTimestamp">
                  {{ claim.allocationClaimedBlockTimestamp }}
                </code>
                <code v-else>Pending</code>
              </td>
              <td class="text-end">
                <code v-if="claim.amount">{{ claim.amount }} $ATOR</code>
              </td>
            </tr>
          </tbody>
        </v-table>
      </v-col>
    </v-row>
  </v-container>
</template>

<style scoped>
.claim-card-actions {
  justify-content: center;
}
</style>

<script setup lang="ts">
import BigNumber from 'bignumber.js'
import { sleep } from 'warp-contracts'

import { useFacilitator } from '~/composables'
import { useFacilitatorStore } from '~/stores/facilitator'

definePageMeta({ middleware: 'auth' })
useHead({ title: 'My Tokens' })

const facilitatorStore = useFacilitatorStore()
const loading = ref<boolean>(false)
const hasError = ref<boolean>(false)

const truncatedHash = (transactionHash?: string) => {
  if (!transactionHash) return ''

  return transactionHash.substring(0, 6)
    + '...'
    + transactionHash.substring(transactionHash.length - 4)
}
const etherscanUrl = (transactionHash?: string) => {
  if (!transactionHash) return ''

  return `https://goerli.etherscan.io/tx/${transactionHash}`
}

const claimableAtomicTokens = useState<string | null>(
  'claimableAtomicTokens',
  () => null
)
const tokensToClaim = computed(() => {
  const store = useFacilitatorStore()
  if (!claimableAtomicTokens.value) { return null }
  if (!store.totalClaimedTokens) { return null }

  return BigNumber(claimableAtomicTokens.value)
    .minus(store.totalClaimedTokens)
    .dividedBy(1e18)
})
const hasTokensToClaim = computed(() => {
  return tokensToClaim.value && tokensToClaim.value.gt(0.00001)
})
const currentlyClaimableTokens = computed(() => {
  const store = useFacilitatorStore()
  if (!claimableAtomicTokens.value || !store.totalClaimedTokens) {
    return null
  }

  return BigNumber(claimableAtomicTokens.value)
    .minus(store.totalClaimedTokens)
    .dividedBy(1e18)
    .toFormat(4)
})

const onClaimClicked = debounce(async () => {
  const facilitator = useFacilitator()
  if (!facilitator) { return }
  loading.value = true
  // await sleep(2000)
  const result = await facilitator.claim()
  if (!result) { hasError.value = true; loading.value = false; return }
  loading.value = false
})
</script>
