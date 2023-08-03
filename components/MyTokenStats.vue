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
                    <!-- act {{ alreadyClaimedTokens }} | cat {{ claimableAtomicTokens }} -->
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

const timestamp = new Date().toUTCString()

const auth = useAuth()

const alreadyClaimedTokens = useState<string | null>(
  'alreadyClaimedTokens',
  () => null
)
const claimableAtomicTokens = useState<string | null>(
  'claimableAtomicTokens',
  () => null
)

const previouslyClaimedTokens = computed(() => {
  if (!alreadyClaimedTokens.value) { return null }
  
  return BigNumber(alreadyClaimedTokens.value)
    .dividedBy(10e18)
    .toFormat(4) + ' $ATOR'
})

const currentlyClaimableTokens = computed(() => {
  if (!claimableAtomicTokens.value || !alreadyClaimedTokens.value) {
    return null
  }

  return BigNumber(claimableAtomicTokens.value)
    .minus(alreadyClaimedTokens.value)
    .dividedBy(10e18)
    .toFormat(4) + ' $ATOR'
})

const totalLifetimeRewards = computed(() => {
  if (!claimableAtomicTokens.value) {
    return null
  }

  return BigNumber(claimableAtomicTokens.value)
    .dividedBy(10e18)
    .toFormat(4) + ' $ATOR'
})

type TokenCards = {
  label: string
  icon: string
  value?: string | number | null
  key: string,
  click?: Function
}[]
const myTokensCards = computed((): TokenCards => {
  return [
    {
      key: 'lifetime-rewards',
      label: 'My Lifetime Rewards',
      icon: 'mdi-bank',
      value: auth.value
        ? totalLifetimeRewards.value
        : '--'
    },
    {
      key: 'claimable-rewards',
      label: 'My Claimable Rewards',
      icon: 'mdi-bank',
      value: auth.value
        ? currentlyClaimableTokens.value
        : '--'
    },
    {
      key: 'previously-claimed',
      label: 'My Claimed Rewards',
      icon: 'mdi-bank',
      value: auth.value
        ? previouslyClaimedTokens.value
        : '--'
    },
  ]
})
</script>
