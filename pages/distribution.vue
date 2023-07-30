<template>
  <v-container class="my-relays-page h-100">
    <v-row>
      <v-col cols="6">
        <StatsCard
          label="Current Distribution Rate"
          icon="mdi-bank"
          :value="data ? `${data.distributionRate} $ATOR / day` : undefined"
        />
      </v-col>
    </v-row>

    <v-row class="h-100">
      <v-col cols="12" class="h-100">
        <div v-if="!pending && data">
          <v-table>
            <thead>
              <!-- <tr><strong>Previous Distributions</strong></tr> -->
              <tr>
                <th class="font-weight-black basic-text">Timestamp</th>
                <th class="font-weight-black basic-text">Time Elapsed</th>
                <th class="font-weight-black basic-text">Distribution Rate</th>
                <th class="font-weight-black basic-text">Total Score</th>
                <th class="font-weight-black basic-text">Tokens Distributed</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="pd in data.previousDistributions" :key="pd.timestamp">
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

              <tr v-if="data.previousDistributions.length < 1">
                <td>No distributions yet!</td>
              </tr>
            </tbody>
            <tfoot>
              <tr>
                <td colspan="6">
                  <span class="text-caption">
                    Last Updated: {{ data.timestamp.toUTCString() }}
                  </span>
                </td>
              </tr>
            </tfoot>
          </v-table>
        </div>

        <div v-else class="center-loading-splash">
          <LoadingBreeze :dots="7" size="large" />
        </div>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { useDistribution } from '~/composables'

useHead({ title: 'Distribution' })

const {
  pending,
  data,
  refresh
} = useLazyAsyncData('distribution', async () => {
  const distribution = await useDistribution()
  if (!distribution) { return null }

  try {
    const distributionRate = await distribution.getDistributionRatePer('day')
    const previousDistributions = await distribution.getPreviousDistributions()
    const latestTimestamp = previousDistributions[0].date

    return {
      distributionRate: distributionRate.toFormat(3),
      previousDistributions,
      timestamp: latestTimestamp
    }
  } catch (error) {
    console.error('Error reading distribution contract', error)
  }
})
</script>
