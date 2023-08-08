<template>
  <v-container class="my-relays-page h-100">
    <v-row>
      <MyTokenStats />
    </v-row>
    <v-row>
      <v-col cols="12">
        Remove this debugging row!
        <p>budget available: {{ gasAvailable }}</p>
        <p>budget used: {{ gasUsed }}</p>
        <p>budget balance: {{ gasBudgetBalance }}</p>
        <v-btn @click="query">Query</v-btn> |
        <v-btn @click="fundOracle">Fund Oracle</v-btn> |
        <v-btn @click="refresh">Refresh</v-btn>
      </v-col>
    </v-row>

    <v-row justify="center">
      <v-col cols="6" class="text-center">
        <v-alert v-model="hasError" type="error" closable :icon="false">
          Error claiming tokens!
        </v-alert>

        <v-card>
          <v-card-actions style="justify-content: center;">
            <v-btn
              class="primary-background"
              :loading="loading"
              :disabled="!!requestUpdateTx"
              @click="fundAndRequest"
            >Claim Tokens</v-btn>
          </v-card-actions>
        </v-card>

        <br />
        <v-divider v-if="requestUpdateTx" />
        <br />

        <v-card v-if="requestUpdateTx">
          <v-card-title>Fund Oracle</v-card-title>
          <v-card-actions style="justify-content: center;">
            <v-icon color="primary">mdi-check</v-icon>
          </v-card-actions>
        </v-card>

        <br />
        <v-divider v-if="requestUpdateTx" />
        <br />

        <v-card v-if="requestUpdateTx">
          <v-card-title>Requesting Update from Oracle</v-card-title>
          <v-card-text>
            <v-progress-circular v-if="!requestUpdateTxReady" indeterminate />
            <v-icon v-else color="primary">mdi-check</v-icon>
          </v-card-text>
        </v-card>

        <br />
        <v-divider v-if="requestUpdateTxReady" />
        <br />

        <v-card v-if="requestUpdateTxReady">
          <v-card-title>Waiting for Oracle Update</v-card-title>
          <v-card-text>
            <v-progress-circular v-if="!allocationUpdatedTx" indeterminate />
            <v-icon v-else color="primary">mdi-check</v-icon>
          </v-card-text>
        </v-card>

        <br />
        <v-divider v-if="allocationUpdatedTx" />
        <br />

        <v-card v-if="allocationUpdatedTx">
          <v-card-title>Waiting for Tokens to Transfer</v-card-title>
          <v-card-text>
            <v-progress-circular v-if="!tokensClaimedTx" indeterminate />
            <template v-else>
              <v-icon color="primary">mdi-party-popper</v-icon>
              <p>Congratulations, you've claimed your $ATOR (Goerli Test) rewards!</p>
              <a
                target="_blank"
                :href="`https://goerli.etherscan.io/tx/${allocationUpdatedTx}`"
              >View Transaction</a>
            </template>
          </v-card-text>
        </v-card>

        <br />
        <v-divider v-if="requestUpdateTxReady" />
        <br />

        <v-card v-if="requestUpdateTxReady">
          <v-card-actions style="justify-content: center;">
            <v-btn class="danger-background" @click="reset">Reset</v-btn>
          </v-card-actions>
        </v-card>

        <!-- <v-timeline side="end">
          <v-timeline-item :dot-color="needsToFund ? '' : 'primary'">
            <v-card>
              <v-card-title>
                {{ `${needsToFund ? 'Fund Oracle & ' : ''}Request Update` }}
              </v-card-title>
              <v-card-actions>
                <v-btn
                  v-if="needsToFund"
                  class="primary-background"
                  :loading="loading"
                  @click="fundAndRequest"
                >Fund Oracle & Request Update</v-btn>
                <v-btn
                  v-else
                  class="primary-background"
                  :loading="loading"
                  @click="requestUpdate"
                >Request Update</v-btn>
              </v-card-actions>
            </v-card>
          </v-timeline-item>

          <v-timeline-item v-if="currentlyClaimableTokens && currentlyClaimableTokens.gt(0)">
            <v-card>
              <v-card-title>Claim Tokens</v-card-title>
              <v-card-actions>
                <v-btn
                  class="primary-background"
                  :loading="loading"
                  @click="claimTokens"
                >Claim Tokens</v-btn>
              </v-card-actions>
            </v-card>
          </v-timeline-item>

        </v-timeline> -->
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

/**
 * State Values
 */

// Token & Facilitator Stats
const gasAvailable = useState<string | null>('gasAvailable', () => null)
const gasUsed = useState<string | null>('gasUsed', () => null)
const oracleWeiRequired = useState<string | null>('oracleWeiRequired', () => null)
const alreadyClaimedTokens = useState<string | null>('alreadyClaimedTokens', () => null)
const tokenAllocation = useState<string | null>('tokenAllocation', () => null)

// Claim Process Statuses
const requestUpdateTx = useState<string | null>('facilitator-request-update-tx', () => null)
const allocationUpdatedTx = useState<string | null>('facilitator-allocation-updated-tx', () => null)
const tokensClaimedTx = useState<string | null>('facilitator-tokens-claimed-tx', () => null)
const requestUpdateTxReady = useState<boolean>('facilitator-request-update-tx-ready', () => false)
const _resetClaimProcessStatuses = () => {
  requestUpdateTx.value = null
  allocationUpdatedTx.value = null
  tokensClaimedTx.value = null
  requestUpdateTxReady.value = false
}

/**
 * Computed Values
 */
const needsToFund = computed(() => {
  if (!gasAvailable.value) { return true }
  if (!oracleWeiRequired.value) { return true }

  return BigNumber(oracleWeiRequired.value).gt(gasAvailable.value)
})
const panelsDisabled = computed(
  () => !gasAvailable.value || !oracleWeiRequired.value
)
const currentlyClaimableTokens = computed(() => {
  if (!tokenAllocation.value || !alreadyClaimedTokens.value) {
    return null
  }

  return BigNumber(tokenAllocation.value)
    .minus(alreadyClaimedTokens.value)
    .dividedBy(10e18)
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
  await facilitator.refresh()
})

const fundAndRequest = debounce(async () => {
  loading.value = true
  const result = await facilitator.receiveAndRequestUpdate()
  loading.value = false
  if (!result) { hasError.value = true; return }
  
  await result.wait()
  requestUpdateTxReady.value = true
})

const fundOracle = debounce(async () => {
  loading.value = true

  try {
    await facilitator.fundOracle()
  } catch (error) {
    console.error('There was an error while funding oracle', error)
    hasError.value = true
  }

  loading.value = false
})

const requestUpdate = debounce(async () => {
  loading.value = true

  try {
    await facilitator.requestUpdate()
  } catch (error) {
    console.error('There was an error while requesting update', error)
    hasError.value = true
  }

  loading.value = false
})

const claimTokens = debounce(async () => {
  loading.value = true

  try {
    await facilitator.claim()
  } catch (error) {
    console.error('There was an error while claiming tokens', error)
    hasError.value = true
  }

  loading.value = false
})

const query = debounce(async () => {
  loading.value = true

  await facilitator.query('RequestingUpdate')

  loading.value = false
})
</script>
