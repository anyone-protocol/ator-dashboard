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
                      v-for="{ key, label, value } in myTokensCards"
                      :key="key"
                      class="text-center"
                      cols="12"
                      sm="12"
                      md="3"
                      lg="3"
                      xl="3"
                      xxl="3"
                    >
                      <div
                        class="
                          text-subtitle-2
                          text-lg-h6
                          basic-text
                          font-weight-bold
                        "
                      >
                        {{ label }}
                      </div>
                      <div
                        v-if="value"
                        class="
                          text-subtitle-2
                          text-lg-h6
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
              Last Updated: {{ timestamp }}
            </code>
          </v-card-subtitle> -->
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import BigNumber from 'bignumber.js'

const auth = useAuth()

/**
 * State Values
 */
// From Distribution
const claimableAtomicTokens = useState<string | null>(
  'claimableAtomicTokens',
  () => null
)
// From Facilitator
const alreadyClaimedTokens = useState<string | null>(
  'alreadyClaimedTokens',
  () => null
)

/**
 * Computed Values
 */
const lifetimeRewards = computed(() => {
  if (!claimableAtomicTokens.value) {
    return null
  }

  return BigNumber(claimableAtomicTokens.value)
    .dividedBy(1e18)
    .toFormat(4) + ' $ATOR'
})
const pendingRewards = computed(() => {
  if (!claimableAtomicTokens.value || !alreadyClaimedTokens.value) {
    return null
  }

  const pending = BigNumber(claimableAtomicTokens.value)
    .minus(alreadyClaimedTokens.value)
    .dividedBy(1e18)

  if (pending.lt(0)) { return '0.0000 $ATOR' }
  return pending.toFormat(4) + ' $ATOR'
})
const previouslyClaimed = computed(() => {
  if (!alreadyClaimedTokens.value) { return null }
  
  return BigNumber(alreadyClaimedTokens.value)
    .dividedBy(1e18)
    .toFormat(4) + ' $ATOR'
})
type TokenCards = {
  label: string
  icon: string
  value?: string | number | null
  key: string
}[]
const myTokensCards = computed((): TokenCards => {
  return [
    {
      key: 'lifetime-rewards',
      label: 'My Lifetime Rewards',
      icon: 'mdi-bank',
      value: auth.value
        ? lifetimeRewards.value
        : '--'
    },
    {
      key: 'pending-rewards',
      label: 'My Pending Rewards',
      icon: 'mdi-bank',
      value: auth.value
        ? pendingRewards.value
        : '--'
    },
    {
      key: 'previously-claimed',
      label: 'Previously Claimed',
      icon: 'mdi-bank',
      value: auth.value
        ? previouslyClaimed.value
        : '--'
    },
  ]
})
</script>
