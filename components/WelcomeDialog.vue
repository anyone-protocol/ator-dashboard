<template>
  <v-dialog v-model="open" width="500">
    <v-card>
      <v-card-title>
        Welcome
      </v-card-title>
      <v-card-text>
        The <strong>ATOR Dashboard</strong> is currently undergoing beta
        testing and may be subject to unexpected behavior, data loss, or
        contract updates as initial development and testing continues.
      </v-card-text>
      <v-card-actions>
        <v-checkbox
          v-model="hideUntilUpdate"
          label="Hide until next update"
        />
        <v-btn color="primary-background" @click="close">Okay</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
const open = useWelcomeDialogOpen()
const welcomeLastSeen = useWelcomeLastSeen()
const hideUntilUpdate = ref<boolean>(!!welcomeLastSeen.value)

const close = () => {
  if (hideUntilUpdate.value) {
    setWelcomeLastSeen(Date.now())
  } else {
    setWelcomeLastSeen(null)
  }

  open.value = false
}
</script>
