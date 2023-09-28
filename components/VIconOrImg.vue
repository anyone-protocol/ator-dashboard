<template>
  <v-icon v-if="icon" class="list-item-icon" :icon="icon" />
  <img
    v-else-if="pathToImg"
    :class="`${appTheme.global.current.value.dark?'gray-light':'gray-dark'}`"
    :src="pathToImg"
    width="24"
    height="24"
  >
  <!-- icon is prioritized if both props are passed in and have values -->
  <div v-else style="width:24px;height:24px" />
</template>

<script>
import { useTheme } from 'vuetify'
export default {
  props: {
    icon: {
      type: [String, undefined],
      required: false,
      default: undefined
    },
    pathToImg: {
      type: [String, undefined],
      required: false,
      default: undefined
    }
  },
  setup() {
    const appTheme = useTheme()
    return { appTheme }
  }
}
</script>
