<template>
  <v-container class="my-relays-page h-100">
    <v-row>
      <v-col cols="12">
        <StatsCard
          label="Current Distribution Rate"
          icon="mdi-bank"
          :value="
            distributionRate
              ? `${distributionRate} $ATOR / day`
              : distributionRate
          "
        />
      </v-col>
    </v-row>

    <v-row class="h-100">
      <v-col cols="12" class="h-100">
        <div>
          <v-table>
            <thead>
              <!-- <tr><strong>Previous Distributions</strong></tr> -->
              <tr>
                <th class="font-weight-black basic-text">Timestamp</th>
                <th class="font-weight-black basic-text">Time Elapsed</th>
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
              <tr
                v-if="previousDistributions && previousDistributions.length > 0"
                v-for="pd in previousDistributions"
                :key="pd.timestamp"
              >
                <td><code>{{ pd.date.toUTCString() }}</code></td>
                <td><code>{{ pd.timeElapsed }}</code></td>
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
                <td colspan="6" v-if="latestTimestamp">
                  <span class="text-caption">
                    Last Updated: {{ latestTimestamp }}
                  </span>
                </td>
              </tr>
            </tfoot>
          </v-table>
        </div>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import BigNumber from 'bignumber.js'

import { PreviousDistribution } from '~/composables'

useHead({ title: 'Distribution' })

const previousDistributions = useState<PreviousDistribution[]>(
  'previousDistributions'
)
const latestTimestamp = computed(() => {
  return previousDistributions.value && previousDistributions.value[0]
    ? previousDistributions.value[0].date.toUTCString()
    : ''
})
const distributionRatePerDay = useState<string | null>(
  'distributionRatePerDay',
  () => null
)
const distributionRate = computed(() => {
  if (distributionRatePerDay.value) {
    return BigNumber(distributionRatePerDay.value).toFormat(3)
  }

  return null
})
</script>
