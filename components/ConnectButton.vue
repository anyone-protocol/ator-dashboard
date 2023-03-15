<template>
  <div class="connect-button">
    <v-btn
      v-if="auth"
      class="text-none font-weight-bold"
      append-icon="mdi-chevron-down"
    >
      {{ truncatedAddress }}
      <v-menu activator="parent">
        <v-list>
          <v-list-item @click="disconnect">
            <v-list-item-title>Disconnect</v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>
    </v-btn>
    
    <v-btn v-else @click="connect">Connect</v-btn>
  </div>
</template>

<script setup lang="ts">
const auth = useAuth()

const connect = async () => {
  const signer = await useSigner()
  if (signer) {
    auth.value = { address: signer.address }
  }
}

const disconnect = () => { auth.value = undefined }

const truncatedAddress = computed(() => {
  if (auth.value) {
    const { address } = auth.value

    return address.substring(0, 6)
      + '...'
      + address.substring(address.length - 4)
  }

  return ''
})
</script>
