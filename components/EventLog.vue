<template>
  <v-table
    ref="table"
    density="compact"
    fixed-header
    class="log-table"
    height="350px"
  >
    <thead fixed>
      <tr>
        <th class="log-text text-uppercase">Time</th>
        <th class="log-text text-uppercase">Message</th>
        <th class="text-end">
          <v-checkbox-btn
            v-model="logs.filters.info"
            hide-details
            color="primary"
            inline
            density="compact"
            class="vertical-align-middle log-text"
          >
            <template #label>
              <span class="log-text text-uppercase">info</span>
            </template>
          </v-checkbox-btn>

          <v-checkbox-btn
            v-model="logs.filters.warn"
            hide-details
            color="primary"
            inline
            density="compact"
            class="vertical-align-middle log-text"
          >
            <template #label>
              <span class="log-text text-uppercase">warn</span>
            </template>
          </v-checkbox-btn>

          <v-checkbox-btn
            v-model="logs.filters.error"
            hide-details
            color="primary"
            inline
            density="compact"
            class="vertical-align-middle log-text"
          >
            <template #label>
              <span class="log-text text-uppercase">error</span>
            </template>
          </v-checkbox-btn>

          <v-btn
            variant="text"
            color="primary"
            size="x-small"
            class="log-text"
            prepend-icon="mdi-content-copy"
            :append-icon="logsCopySuccess ? 'mdi-check' : undefined"
            @click="onCopyLogsToClipboardClicked"
          >
            Copy Logs
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
          <code class="log-text">
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
  width: 10%;
}

.log-message-cell {
  word-break: break-all;
}

.vertical-align-middle {
  vertical-align: middle;
}

.log-text {
  font-size: 12px;
}

.log-control-text {
  font-size: 12px;
}
</style>

<script setup lang="ts">
import { VTable } from 'vuetify/lib/components/index.mjs'
import { useEventlogStore } from '~/stores/eventlog'
import Logger, { LogLevel } from '~/utils/logger'

const logger = new Logger('EventLog.vue')
const logs = useEventlogStore()
const table = ref<VTable>()
const logsCopySuccess = ref(false)

const logColorClass = (type: LogLevel) => {
  if (type === 'error') { return 'text-error' }
  if (type === 'warn') { return 'text-warn' }
  return ''
}
/* NB: Scroll to end of logs on new messages */
watch(logs.logs, () => {
  if (!table.value) { return }
  const wrapper = (table.value.$el as HTMLDivElement)
    .getElementsByClassName('v-table__wrapper')
    .item(0)
  if (!wrapper) { return }
  wrapper.scrollTo({
    top: wrapper.scrollHeight,
    left: 0,
    behavior: 'smooth'
  })
})

const onCopyLogsToClipboardClicked = debounce(async () => {
  const type = 'text/plain'
  const logsJson = JSON.stringify(logs.logs)
  const logsBlob = new Blob([logsJson], { type })
  const item = new ClipboardItem({ [type]: logsBlob })

  try {
    await navigator.clipboard.write([item])
    logsCopySuccess.value = true
  } catch (error) {
    logger.error('Error copying logs to clipboard', error)
  }
})
</script>
