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
            <p v-if="hasTokensToClaim">
              You have
              <code>{{ currentlyClaimableTokens }} $ATOR (Goerli Test)</code>
              ready to claim!
            </p>
            <p v-else>No tokens to claim!</p>
          </v-card-text>

          <v-card-actions
            v-if="hasTokensToClaim"
            style="justify-content: center;"
          >
            <v-btn
              class="primary-background"
              :loading="loading"
              @click="claim"
            >
              Claim Tokens
            </v-btn>
          </v-card-actions>
        </v-card>

        <v-card v-if="allocationUpdatedTx">
          <v-card-title>Waiting for Tokens to Transfer</v-card-title>
          <v-card-text>
            <v-progress-circular v-if="!tokensClaimedTx" indeterminate />
            <template v-else>
              <v-icon color="primary">mdi-party-popper</v-icon>
              <p>
                Congratulations, you've claimed your
                {{ claimedAllocationCachedValueHumanized }}
                $ATOR (Goerli Test) rewards!
              </p>
              <a
                target="_blank"
                :href="etherscanUrl(allocationUpdatedTx)"
              >View Transaction</a>
            </template>
          </v-card-text>
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
              v-for="claim in facilitatorStore.claims"
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

<script setup lang="ts">
import BigNumber from 'bignumber.js'

import { useFacilitator } from '~/composables'
import { useFacilitatorStore } from '~/stores/facilitator'

definePageMeta({ middleware: 'auth' })
useHead({ title: 'My Tokens' })

const facilitatorStore = useFacilitatorStore()

/**
 * Refs
 */
const loading = ref<boolean>(false)
const hasError = ref<boolean>(false)

/**
 * UI Helpers
 */
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

/**
 * State Values
 */
const alreadyClaimedTokens = useState<string | null>(
  'alreadyClaimedTokens',
  () => null
)
const claimableAtomicTokens = useState<string | null>(
  'claimableAtomicTokens',
  () => null
)
const allocationUpdatedTx = useState<string | null>(
  'facilitator-allocation-updated-tx',
  () => null
)
const tokensClaimedTx = useState<string | null>(
  'facilitator-tokens-claimed-tx',
  () => null
)
const claimedAllocationCachedValue = useState<bigint | null>(
  'token-contract-facilitator-transfer',
  () => null
)

/**
 * Computed Values
 */
const claimedAllocationCachedValueHumanized = computed(() => {
  if (!claimedAllocationCachedValue.value) { return null }

  return BigNumber(claimedAllocationCachedValue.value.toString())
    .dividedBy(1e18)
    .toFormat(3)
})
const tokensToClaim = computed(() => {
  if (!claimableAtomicTokens.value) { return null }
  if (!alreadyClaimedTokens.value) { return null }

  return BigNumber(claimableAtomicTokens.value)
    .minus(alreadyClaimedTokens.value)
    .dividedBy(1e18)
})
const hasTokensToClaim = computed(() => {
  return tokensToClaim.value && tokensToClaim.value.gt(0.00001)
})
const currentlyClaimableTokens = computed(() => {
  if (!claimableAtomicTokens.value || !alreadyClaimedTokens.value) {
    return null
  }

  return BigNumber(claimableAtomicTokens.value)
    .minus(alreadyClaimedTokens.value)
    .dividedBy(1e18)
    .toFormat(4)
})

/**
 * UI Actions
 */
const claim = debounce(async () => {
  const facilitator = useFacilitator()
  if (!facilitator) { return }
  loading.value = true
  const result = await facilitator.fundOracle()
  if (!result) { hasError.value = true; loading.value = false; return }
  loading.value = false
})
</script>
