<template>
  <div class="connect-button">
    <v-btn
      v-if="auth"
      class="text-none font-weight-bold top-bar-button"
    >
      <code>{{ auth.address }}</code>
      <!-- {{ truncatedAddress }} -->
      <!-- <v-menu activator="parent">
        <v-list>
          {{ auth.address }}
        </v-list>
      </v-menu> -->
    </v-btn>
    
    <v-btn
      v-else
      class="top-bar-button"
      :class="{ animate: shouldAnimate }"
      :color="shouldAnimate ? 'red' : 'primary'"
      variant="tonal"
      @click="connect"
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
const auth = await setupAuth()

const connect = async () => {
  const signer = await useSigner()
  if (signer) {
    auth.value = { address: signer.address }
    const openWelcomeDialog = useWelcomeDialogOpen()
    const welcomeLastSeen = useWelcomeLastSeen()
    const { welcomeDialogUpdated } = useAppConfig()
    openWelcomeDialog.value = welcomeLastSeen.value
      ? welcomeLastSeen.value < welcomeDialogUpdated
      : true
  }
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
