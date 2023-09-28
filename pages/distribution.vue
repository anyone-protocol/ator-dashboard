<template>
  <v-container class="my-relays-page h-100">
    <v-row>
      <v-col cols="7">
        <StatsCard
          label="Current Distribution Rate"
          icon="mdi-bank"
          :value="distributionRate"
        />
      </v-col>
      <v-col>
        <StatsCard
          label="Total Distributed"
          icon="mdi-bank"
          :value="totalDistributed"
        />
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="12">
        <div>
          <v-table fixed-header fixed-footer>
            <thead>
              <tr>
                <th class="font-weight-black basic-text">Time</th>
                <th class="font-weight-black basic-text">Elapsed</th>
                <th class="font-weight-black basic-text text-right">
                  Distribution Rate
                </th>
                <th class="font-weight-black basic-text text-right">
                  Total Score
                </th>
                <th class="font-weight-black basic-text text-right">
                  Tokens Distributed
                </th>
              </tr>
            </thead>
            <tbody>
              <template
                v-if="previousDistributions && previousDistributions.length > 0"
              >
                <tr
                  v-for="pd in pagedPreviousDistributions"
                  :key="pd.timestamp"
                >
                  <td>
                    <v-tooltip class="v-tooltip-opaque-background">
                      <template #activator="{ props }">
                        <code v-bind="props">
                          {{ pd.fromNowHumanized }}
                        </code>
                      </template>
                      <code>{{ pd.date.toUTCString() }}</code>
                    </v-tooltip>
                  </td>
                  <td>
                    <v-tooltip class="v-tooltip-opaque-background">
                      <template #activator="{ props }">
                        <code v-bind="props">
                          {{ pd.timeElapsedHumanized }}
                        </code>
                      </template>
                      <code>{{ pd.timeElapsed }}</code>
                    </v-tooltip>
                  </td>
                  <td class="text-right">
                    <code>{{ pd.tokensDistributedPerDay }} $ATOR / day</code>
                  </td>
                  <td class="text-right">
                    <code>{{ pd.totalScore }}</code>
                  </td>
                  <td class="text-right">
                    <code>{{ pd.totalDistributed }} $ATOR</code>
                  </td>
                </tr>
              </template>

              <tr v-else-if="!previousDistributions">
                <td width="100%" colspan="5">
                  <LoadingBreeze :dots="7" size="large" />
                </td>
              </tr>

              <tr v-else>
                <td>No distributions yet!</td>
              </tr>
            </tbody>
            <tfoot>
              <tr>
                <td
                  v-if="latestTimestamp"  
                  colspan="1"
                  class="distribution-table"
                >
                  <span class="text-caption">
                    <v-tooltip class="v-tooltip-opaque-background">
                      <template #activator="{ props }">
                        <code v-bind="props">
                          Last Updated:
                          {{ latestTimestampHumanized }}
                        </code>
                      </template>
                      <code>{{ latestTimestamp }}</code>
                    </v-tooltip>
                  </span>
                </td>
                <td colspan="5" class="distribution-table">
                  <v-pagination
                    v-model="page"
                    total-visible="10"
                    :length="
                      previousDistributions
                        ? (previousDistributions.length / pageSize)
                        : 0
                    "
                  />
                </td>
              </tr>
            </tfoot>
          </v-table>
        </div>
      </v-col>
    </v-row>
  </v-container>
</template>

<style scoped>
.distribution-table {
  background-color: rgb(var(--v-theme-surface));
}
</style>

<script setup lang="ts">
import BigNumber from 'bignumber.js'
import moment from 'moment'

import { PreviousDistribution } from '~/composables'

useHead({ title: 'Distribution' })

const page = ref<number>(1) // NB: pages are 1-indexed :)
const pageSize = ref<number>(10)

const previousDistributions = useState<PreviousDistribution[]>(
  'previousDistributions'
)
const pagedPreviousDistributions = computed(() => {
  if (!previousDistributions.value) { return null }

  return previousDistributions.value.slice(
    (page.value - 1) * pageSize.value,
    (page.value * pageSize.value) - 1
  )
})
const latestTimestamp = computed(() => {
  return previousDistributions.value && previousDistributions.value[0]
    ? previousDistributions.value[0].date.toUTCString()
    : ''
})
const latestTimestampHumanized = computed(() => {
  return previousDistributions.value && previousDistributions.value[0]
    ? moment(previousDistributions.value[0].date).fromNow()
    : ''
})
const distributionRatePerDay = useState<string | null>(
  'distributionRatePerDay',
  () => null
)
const distributionRate = computed(() => {
  if (distributionRatePerDay.value) {
    return BigNumber(distributionRatePerDay.value)
      .toFormat(3) +  ' $ATOR / day'
  }

  return null
})
const sumOfTotalDistributions = useState<string | null>(
  'sumOfTotalDistributions',
  () => null
)
const totalDistributed = computed(() => {
  if (sumOfTotalDistributions.value) {
    return BigNumber(sumOfTotalDistributions.value)
      .dividedBy(1e18)
      .toFormat(3) + ' $ATOR'
  }

  return null
})
</script>
