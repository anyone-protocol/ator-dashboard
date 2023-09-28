<template>
  <div class="connect-button">
    <div
      v-if="auth"
      class="font-weight-bold"
      style="margin-right:10px"
    >
      <div v-if="smallScreen" style="cursor:pointer">
        <code>{{ truncatedAddress }}</code>
        <v-menu activator="parent" offset-y :close-on-content-click="false">
          <v-list>
            <v-list-item>
              <TokenBalance />
              <v-divider />
              <code>{{ auth.address }}</code>
            </v-list-item>
          </v-list>
        </v-menu>
      </div>
      <div v-else>
        <TokenBalance />
        <v-divider />
        <code>{{ auth.address }}</code>
      </div>
    </div>
    
    <v-btn
      v-else
      class="top-bar-button"
      :class="{ animate: shouldAnimate }"
      :color="shouldAnimate ? 'red' : 'primary'"
      variant="tonal"
      @click.stop="suggestMetaMask ? linkToGetMetaMask() : connect()"
    >
      Connect
    </v-btn>
  </div>
</template>

<style scoped>
  .animate {
    animation: wiggle 1s;

    /* animation-iteration-count: infinite; */
  }

  @keyframes wiggle {
    0%    { transform: rotate(10deg);  }
    25%   { transform: rotate(-10deg); }
    50%   { transform: rotate(10deg);  }
    75%   { transform: rotate(-10deg); }
    100%  { transform: rotate(0deg);   }
  }
</style>

<script setup lang="ts">
import { connectAuth } from '~/composables/auth'

const auth = useAuth()

const connect = debounce(async () => { await connectAuth() })

const linkToGetMetaMask = () => {
  window.open("https://metamask.io/download/", '_blank')
}

const truncatedAddress = computed(() => {
  if (auth.value) {
    const { address } = auth.value

    return address.substring(0, 6)
      + '...'
      + address.substring(address.length - 4)
  }

  return ''
})

const shouldAnimate = computed(() => useHighlightConnectButton().value)
</script>
