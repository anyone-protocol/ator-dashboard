<template>
  <v-btn
    variant="text"
    color="primary"
    size="small"
    @click="onReportIssueClicked"
  >
    Report Issue
  </v-btn>
</template>

<script setup lang="ts">
import { useEventlogStore } from '~/stores/eventlog'

const eventlog = useEventlogStore()

const onReportIssueClicked = debounce(() => {
  eventlog.isReportIssueOpen = true
})
</script>
