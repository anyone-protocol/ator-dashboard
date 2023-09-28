<template>
  <v-container class="my-relays-page h-100">
    <v-row>
      <MyTokenStats />
    </v-row>
    <v-row v-if="debug">
      <v-col cols="12">
        <p><strong>Remove this debugging row!</strong></p>
        <p>
          facilitatorTokenBalance:
          {{ facilitatorTokenBalanceHumanized }}
          $ATOR TEST
        </p>
        <p>budget available: {{ gasAvailable }}</p>
        <p>budget used: {{ gasUsed }}</p>
        <p>budget balance: {{ gasBudgetBalance }}</p>
        <p>token-contract-facilitator-transfer: {{ allocationUpdatedTx }}</p>
        <p>facilitator-request-update-tx: {{ requestUpdateTx }}</p>
        <p>facilitator-allocation-updated-tx: {{ allocationUpdatedTx }}</p>
        <p>facilitator-tokens-claimed-tx: {{ tokensClaimedTx }}</p>
        <p>facilitator-request-update-tx-ready: {{ requestUpdateTxReady }}</p>
        <p>
          isClaimInProgressButNotComplete: {{ isClaimInProgressButNotComplete }}
        </p>
        <v-btn @click="query">Query</v-btn> |
        <v-btn @click="refresh">Refresh</v-btn>
      </v-col>
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
            <!-- <p v-else-if="requestUpdateTx">Claiming tokens...</p> -->
            <p v-else>No tokens to claim!</p>
          </v-card-text>

          <v-card-actions
            v-if="hasTokensToClaim"
            style="justify-content: center;"
          >
            <v-btn
              class="primary-background"
              :loading="loading"
              :disabled="isClaimInProgressButNotComplete"
              @click="fundAndRequest"
            >
              Claim Tokens
            </v-btn>
          </v-card-actions>
        </v-card>

        <br>
        <v-divider v-if="requestUpdateTx" />
        <br>

        <v-card v-if="requestUpdateTx">
          <v-card-title>Fund Oracle</v-card-title>
          <v-card-actions style="justify-content: center;">
            <v-icon color="primary">mdi-check</v-icon>
          </v-card-actions>
        </v-card>

        <br>
        <v-divider v-if="requestUpdateTx" />
        <br>

        <v-card v-if="requestUpdateTx">
          <v-card-title>Requesting Update from Oracle</v-card-title>
          <v-card-text>
            <v-progress-circular v-if="!requestUpdateTxReady" indeterminate />
            <v-icon v-else color="primary">mdi-check</v-icon>
          </v-card-text>
        </v-card>

        <br>
        <v-divider v-if="requestUpdateTxReady" />
        <br>

        <v-card v-if="requestUpdateTxReady">
          <v-card-title>Waiting for Oracle Update</v-card-title>
          <v-card-text>
            <v-progress-circular v-if="!allocationUpdatedTx" indeterminate />
            <v-icon v-else color="primary">mdi-check</v-icon>
          </v-card-text>
        </v-card>

        <br>
        <v-divider v-if="allocationUpdatedTx" />
        <br>

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
                :href="`https://goerli.etherscan.io/tx/${allocationUpdatedTx}`"
              >View Transaction</a>
            </template>
          </v-card-text>
        </v-card>

        <br>
        <v-divider v-if="requestUpdateTxReady" />
        <br>

        <v-card v-if="debug && requestUpdateTxReady">
          <v-card-actions style="justify-content: center;">
            <v-btn class="danger-background" @click="reset">Reset</v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import BigNumber from 'bignumber.js'

import { useFacilitator } from '~/composables'

definePageMeta({ middleware: 'auth' })
useHead({ title: 'My Tokens' })
const facilitator = useFacilitator()
const auth = useAuth()

/**
 * Ref Values
 */
const loading = ref<boolean>(false)
const hasError = ref<boolean>(false)
const debug = ref<boolean>(false)

/**
 * State Values
 */

// Token & Facilitator Stats
const gasAvailable = useState<string | null>('gasAvailable', () => null)
const gasUsed = useState<string | null>('gasUsed', () => null)
const alreadyClaimedTokens = useState<string | null>(
  'alreadyClaimedTokens',
  () => null
)
const facilitatorTokenBalance = useState<string | null>(
  'facilitatorTokenBalance',
  () => null
)
const claimableAtomicTokens = useState<string | null>(
  'claimableAtomicTokens',
  () => null
)

// Claim Process Statuses
const requestUpdateTx = useState<string | null>(
  'facilitator-request-update-tx',
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
const requestUpdateTxReady = useState<boolean>(
  'facilitator-request-update-tx-ready',
  () => false
)
const claimedAllocationCachedValue = useState<bigint | null>(
  'token-contract-facilitator-transfer',
  () => null
)
// NB: For debugging, only visual
const _resetClaimProcessStatuses = () => {
  requestUpdateTx.value = null
  allocationUpdatedTx.value = null
  tokensClaimedTx.value = null
  requestUpdateTxReady.value = false
}

/**
 * Computed Values
 */
const isClaimInProgressButNotComplete = computed(() => {
  const isAnyProgress = !!requestUpdateTx.value
    || !!requestUpdateTxReady.value  
    || !!allocationUpdatedTx.value
    || !!tokensClaimedTx.value

  const isCompleteProgress = !!tokensClaimedTx.value

  return isAnyProgress && !isCompleteProgress
})
const claimedAllocationCachedValueHumanized = computed(() => {
  if (!claimedAllocationCachedValue.value) { return null }

  return BigNumber(claimedAllocationCachedValue.value.toString())
    .dividedBy(1e18)
    .toFormat(3)
})
const facilitatorTokenBalanceHumanized = computed(() => {
  if (!facilitatorTokenBalance.value) { return null }
  return BigNumber(facilitatorTokenBalance.value).dividedBy(1e18).toFormat(3)
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
const gasBudgetBalance = computed(() => {
  if (!gasAvailable.value || !gasUsed.value) { return null }

  return BigNumber(gasAvailable.value).minus(gasUsed.value).toString()
})

/**
 * UI Actions
 */
const reset = debounce(_resetClaimProcessStatuses)
const refresh = debounce(async () => {
  await facilitator!.refresh()
})

const fundAndRequest = debounce(async () => {
  loading.value = true
  _resetClaimProcessStatuses()
  // const result = await facilitator.receiveAndRequestUpdate()
  const result = await facilitator!.fundOracle()
  loading.value = false
  if (!result) { hasError.value = true; return }
  
  await result.wait()
  requestUpdateTxReady.value = true
})

const query = debounce(async () => {
  if (!auth.value) { return }
  
  loading.value = true
  await facilitator!.query('RequestingUpdate', auth.value.address)
  loading.value = false
})
</script>
