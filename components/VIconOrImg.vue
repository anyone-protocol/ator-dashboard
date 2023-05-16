<template>
  <v-icon v-if="icon" class="list-item-icon" :icon="icon"></v-icon>
  <img v-else-if="pathToImg" class="black-and-white" :src="pathToImg" width="24" height="24" />
  <!-- icon is prioritized if both props are passed in and have values -->
  <div v-else style="width:24px;height:24px"></div>
</template>

<script>
export default {
  props: {
    icon: String,
    pathToImg: String
  }
};
</script>
