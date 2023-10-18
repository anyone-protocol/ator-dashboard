<template>
  <v-dialog v-model="eventlog.isReportIssueOpen" width="500">
    <v-card>
      <v-card-title>
        <h4 tabindex="999" @keyup="onKeyup">Report Issue</h4>
      </v-card-title>
      <v-card-text>
        <v-container class="pb-0">
          <v-row dense>
            <v-col cols="12">
              <v-text-field
                ref="titleField"
                v-model="title"
                hint="Title will be public"
                label="Issue Title"
                :rules="[rules.required]"
                persistent-hint
                class="mb-1"
              >
                <template #message="{ message }">
                  <v-icon size="x-small">mdi-alert</v-icon>
                  {{ message }}
                </template>
              </v-text-field>
              <v-textarea
                v-model="desc"
                hint="Description will be public"
                label="Issue Description (optional)"
                persistent-hint
              >
                <template #message="{ message }">
                  <v-icon size="x-small">mdi-alert</v-icon>
                  {{ message }}
                </template>
              </v-textarea>
            </v-col>
          </v-row>
        </v-container>
      </v-card-text>
      <v-card-actions>
        <v-container class="pt-0">
          <v-row dense>
            <v-col cols="12" class="text-center">
              <v-btn
                variant="outlined"
                size="x-small"
                color="primary"
                :append-icon="logsCopySuccess ? 'mdi-check' : undefined"
                @click="onCopyLogsClicked"
              >
                (Optional) Copy Encrypted Logs
              </v-btn>
            </v-col>
          </v-row>

          <v-row dense>
            <v-col cols="auto">
              <v-btn
                variant="outlined"
                size="x-small"
                color="error"
                @click="onCancelClicked"
              >
                Cancel
              </v-btn>
            </v-col>
            <v-spacer />
            <v-col cols="auto">
              <v-btn
                variant="outlined"
                size="x-small"
                color="primary"
                append-icon="mdi-open-in-new"
                @click="onReportIssueClicked"
              >
                Open GitHub Issue
              </v-btn>
            </v-col>
          </v-row>
        </v-container>        
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { hexlify } from 'ethers'
import { storeToRefs } from 'pinia';
import { VTextField } from 'vuetify/lib/components/index.mjs'

import {
  EncryptedPayload,
  SupportIssue,
  useEventlogStore
} from '~/stores/eventlog'
import Logger from '~/utils/logger'

const config = useRuntimeConfig()
const eventlog = useEventlogStore()
const auth = useAuth()
const route = useRoute()
const logger = new Logger('ReportIssueDialog.vue')

const title = ref<string>('')
const titleField = ref<VTextField>()
const desc = ref<string>('')
const payload = ref<EncryptedPayload>()
const { isReportIssueOpen, isSupportIssueOpen } = storeToRefs(eventlog)

const rules = {
  required: (value: string) => !!value || 'Required'
}

watch(isReportIssueOpen, (value) => {
  if (!value) {
    // NB: Drop encryption related stuff when dialog closes
    logsCopySuccess.value = false
    payload.value = undefined
  }
})

const onCancelClicked = debounce(() => {
  isReportIssueOpen.value = false
})

const onReportIssueClicked = debounce(async () => {
  await titleField.value!.validate()
  if (!title.value) { return }

  const description = desc.value || '<Enter description here>'

  try {
    const baseBody = `**Description**\n${description}`
    let encryptedBody = ''

    if (payload.value && logsCopySuccess.value) {
      encryptedBody = `\n\n**Logs**\n<Paste Encrypted Logs Here>`
    }

    const body = encodeURI(baseBody + encryptedBody)
    const urlBase = `${config.public.githubNewIssueUrl}?template=bug_report.md`
    const url = `${urlBase}&title=${encodeURI(title.value)}&body=${body}`

    logger.info('creating new issue with url', url)
    window.open(url, '_blank')
  } catch (error) {
    logger.error('Error reporting issue', error)
  }
})

const lastkeys: string[] = []
const onKeyup = (evt: KeyboardEvent) => {
  lastkeys.push(evt.key)
  if (lastkeys.length > 5) { lastkeys.shift() }
  if (lastkeys.join('') === 'idkfa') {
    isReportIssueOpen.value = false
    isSupportIssueOpen.value = true
  }
}

const logsCopySuccess = ref<boolean>(false)
const onCopyLogsClicked = debounce(async () => {
  try {
    const supportIssue: SupportIssue = {
      address: auth.value?.address || 'anonymous',
      logs: eventlog.logs,
      host: window.location.host,
      path: route.path,
      phase: config.public.phase
    }

    const { encrypted, publicKey, nonce } = encrypt(
      JSON.stringify(supportIssue),
      config.public.supportWalletPublicKeyBase64
    )

    const encryptedPayload: EncryptedPayload = {
      encrypted: hexlify(encrypted),
      nonce: hexlify(nonce),
      publicKey: hexlify(publicKey)
    }

    payload.value = encryptedPayload

    const type = 'text/plain'
    const logsJson = JSON.stringify(payload.value)
    const logsBlob = new Blob([ logsJson ], { type })
    const item = new ClipboardItem({ [type]: logsBlob })
    await navigator.clipboard.write([ item ])
    logger.info('copied encrypted logs to clipboard')
    logsCopySuccess.value = true
  } catch (error) {
    logger.error('Error copying logs to clipboard', error)
  }
})
</script>
