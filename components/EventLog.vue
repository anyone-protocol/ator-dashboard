<template>
  <v-table height="200px" density="compact" fixed-header class="log-table">
    <thead fixed>
      <tr>
        <th><code class="log-text">Time</code></th>
        <th><code class="log-text">Message</code></th>
        <th class="text-end">
          <v-switch
            v-model="logs.filters.info"
            hide-details
            color="primary"
            inline
            class="d-inline-block"
            density="compact"
          >
            <template #label>
              <span class="log-text text-caption text-uppercase">info</span>
            </template>
          </v-switch>

          <v-switch
            v-model="logs.filters.warn"
            hide-details
            color="primary"
            inline
            class="d-inline-block pl-4"
            density="compact"
          >
            <template #label>
              <span class="log-text text-caption text-uppercase">warn</span>
            </template>
          </v-switch>

          <v-switch
            v-model="logs.filters.error"
            hide-details
            color="primary"
            inline
            class="d-inline-block pl-4"
            density="compact"
          >
            <template #label>
              <span class="log-text text-caption text-uppercase">error</span>
            </template>
          </v-switch>

          <v-btn
            icon
            variant="text"
            color="primary"
            class="d-inline-block copy-button"
            @click="onCopyLogsToClipboardClicked"
          >
            <v-icon>mdi-content-copy</v-icon>
          </v-btn>
        </th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="log in logs.filtered" :key="log.timestamp" class="log-row">
        <td class="log-timestamp-cell">
          <code :class="logColorClass(log.level)" class="log-text">
            {{ new Date(log.timestamp).toUTCString() }}
          </code>
        </td>
        <td colspan="2" class="log-message-cell">
          <code :class="logColorClass(log.level)" class="log-text">
            {{ log.message }}
          </code>
        </td>
      </tr>
      <tr v-if="logs.filtered.length < 1">
        <td colspan="3">
          <code class="text-primary log-text">
            Logs are empty, change filter to show more
          </code>
        </td>
      </tr>
    </tbody>
  </v-table>
</template>

<style scoped>
.log-table:deep(.v-table__wrapper) {
  overscroll-behavior: contain;
  overflow-y: scroll;
}

.log-row {
  width:100%;
}

.log-timestamp-cell {
  width: 224px;
}

.log-message-cell {
  word-break: break-all;
}

.copy-button {
  vertical-align: top;
}

.log-text {
  font-size: 12px;
}
</style>

<script setup lang="ts">
import { useEventlogStore } from '~/stores/eventlog'
import { LogLevel } from '~/utils/logger'

const logs = useEventlogStore()
const logColorClass = (type: LogLevel) => {
  return type === 'error' ? 'text-error' : 'text-primary'
}

const onCopyLogsToClipboardClicked = debounce(async () => {
  const type = 'text/plain'
  const logsJson = JSON.stringify(logs.logs)
  const logsBlob = new Blob([logsJson], { type })
  const item = new ClipboardItem({ [type]: logsBlob })

  try {
    await navigator.clipboard.write([item])
  } catch (error) {
    console.error('Error copying logs to clipboard', error)
  }
})
</script>
