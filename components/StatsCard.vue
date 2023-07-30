<template>
  <v-card class="v-card-ator">
    <v-container>
      <v-row align="center">
        <v-col cols="7">
          <div :class="labelClass">
            {{ label }}
          </div>
          <div v-if="value" :class="valueClass">
            <code>{{ value }}</code>
          </div>
          <LoadingBreeze v-else :dots="11" />
        </v-col>
        <v-col cols="5" class="text-right">
          <v-icon :icon="icon" class="icon-ator"></v-icon>
        </v-col>
      </v-row>
    </v-container>
  </v-card>
</template>

<script setup lang="ts">
export interface StatsCardProps {
  label: string
  icon: string
  value?: string | number
  labelClass?: string
  valueClass?: string
}

withDefaults(defineProps<StatsCardProps>(), {
  labelClass: 'text-h6 text-lg-h5 basic-text font-weight-bold',
  valueClass: 'text-h5 font-weight-black basic-text'
})
</script>
