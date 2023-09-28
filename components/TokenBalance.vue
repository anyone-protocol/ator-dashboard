<template>
  <code v-if="auth && tokenBalance">
    {{ BigNumber(tokenBalance).dividedBy(1e18).toFormat(3) }}
    $ATOR (Goerli Test)
  </code>
  <LoadingBreeze v-else-if="auth" />
</template>

<script setup lang="ts">
import BigNumber from 'bignumber.js'

const auth = useAuth()
const tokenBalance = useState<string | null>('tokenBalance', () => null)
</script>
