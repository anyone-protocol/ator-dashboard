<template>
  <v-card class="v-card-ator">
    <v-container>
      <v-row align="center">
        <v-col cols="7">
          <div class="text-subitle-2 basic-text">
            {{ label }}
          </div>
          <div v-if="!value" class="mt-3">
            <ConnectButton v-if="requiresAuth && !auth" />
            <LoadingBreeze v-else :dots="11" />
          </div>
          <div v-else :class="'text-h5 font-weight-black basic-text'">
            <code>{{ value }}</code>
          </div>
        </v-col>
        <v-col cols="5" class="text-right">
          <v-icon :icon="icon" class="icon-ator"></v-icon>
        </v-col>
      </v-row>
    </v-container>
  </v-card>
</template>

<script setup lang="ts">
const { requiresAuth, value } = defineProps<{
  label: string
  icon: string
  value?: string | number
  requiresAuth?: boolean
  valueClass?: string
}>()

if (requiresAuth) {

}

const auth = useAuth()
</script>
