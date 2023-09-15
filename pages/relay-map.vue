<template>
  <div>
    <MapboxComponent :locations="locations"/>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useTorDetails } from '~/composables/apis'

useHead({ title: 'Relay Map' })

const { data, fetchDetails } = useTorDetails()

const locations = ref([]);

await fetchDetails()
locations.value = toRaw(data.value).map((item: { latitude: string; longitude: string; }) => ({ lat: item.latitude, lon: item.longitude }));
</script>
