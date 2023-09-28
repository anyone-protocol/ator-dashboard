import Arweave from 'arweave'
import ArDB from 'ardb'
import ArdbTransaction from 'ardb/lib/models/transaction'
import { useTxCache } from './txCache'

const arweave = new Arweave({})
const ardb = new ArDB(arweave)

const { getTransactionData, saveTransactionData } = useTxCache()

export interface ValidationStats {
  consensus_weight: number
  consensus_weight_fraction: number
  observed_bandwidth: number
  verification: {
    failed: number
    running: number
    unclaimed: number
    verified: number
  }
  verified_and_running: {
    consensus_weight: number
    consensus_weight_fraction: number
    observed_bandwidth: number
  }
}

export type RelayVerificationResult =
    | 'OK'
    | 'AlreadyVerified'
    | 'NotRegistered'
    | 'Failed'
export interface ValidatedRelay {
  fingerprint: string
  ator_address: string
  consensus_weight: number
  consensus_weight_fraction: number
  observed_bandwidth: number
  running: boolean
}
export interface VerificationResultDto {
  result: RelayVerificationResult
  relay: ValidatedRelay
}

export class RelayMetrics {
  metricsDeployer!: string
  gateway!: string
  validationStats: ValidationStats | null = null
  validationStatsTimestamp: Date | null = null
  relayMetrics: VerificationResultDto[] = []
  relayMetricsTimestamp: Date | null = null

  private _lastRefresh: number | null = null
  private _refreshInterval = 60 * 1000

  constructor(
    gateway: string,
    metricsDeployer: string
  ) {
    this.gateway = gateway
    this.metricsDeployer = metricsDeployer
  }

  async refresh() {
    const shouldRefresh = !this._lastRefresh
      || Date.now() - this._lastRefresh >= this._refreshInterval

    if (!shouldRefresh) {
      // console.log('Metrics did not refresh', this._lastRefresh)
      return
    }
    // console.log('Metrics refreshing')
    console.time('metrics')
    await this.refreshValidationStats()
    await this.refreshRelayMetrics()
    console.timeEnd('metrics')
    // console.log('Metrics refreshed', {
    //   validationStats: this.validationStats,
    //   validationStatsTimestamp: this.validationStatsTimestamp,
    //   relayMetrics: this.relayMetrics,
    //   relayMetricsTimestamp: this.relayMetricsTimestamp
    // })
    this._lastRefresh = Date.now()
  }

  private async refreshValidationStats() {
    const tx: ArdbTransaction | null = await ardb
      .search('transactions')
      .from(this.metricsDeployer)
      .tags([
        { name: 'Protocol', values: 'ator' },
        { name: 'Entity-Type', values: 'validation/stats' }
      ])
      .sort('HEIGHT_DESC')
      .findOne() as ArdbTransaction | null
  
    if (tx) {
      try {
        let validationStats = await getTransactionData(tx.id)

        if (!validationStats) {
          validationStats = await $fetch<ValidationStats>(
            `${this.gateway}/${tx.id}`
          )
          await saveTransactionData(tx.id, validationStats)
        }
  
        useState<ValidationStats>('validationStats').value = validationStats
        this.validationStats = validationStats
      } catch (error) {
        console.error('Could not fetch validation/stats tx', error)
      }

      const timestamp = parseInt(
        tx.tags.find(tag => tag.name === 'Content-Timestamp')?.value || ''
      )
      if (!Number.isNaN(timestamp)) {
        useState<number>('validationStatsTimestamp').value = timestamp
        this.validationStatsTimestamp = new Date(timestamp)
      }
    } else {
      console.error('Could not find validation/stats tx')
    }
  }

  private async refreshRelayMetrics() {
    const tx: ArdbTransaction | null = await ardb
      .search('transactions')
      .from(this.metricsDeployer)
      .tags([
        { name: 'Protocol', values: 'ator' },
        { name: 'Entity-Type', values: 'relay/metrics' }
      ])
      .sort('HEIGHT_DESC')
      .findOne() as ArdbTransaction | null

    if (tx) {
      try {
        let relayMetrics = await getTransactionData(tx.id)

        if (!relayMetrics) {
          relayMetrics = await $fetch<VerificationResultDto[]>(`${this.gateway}/${tx.id}`)
          await saveTransactionData(tx.id, relayMetrics)
        }
  
        useState<VerificationResultDto[]>('relayMetrics').value = relayMetrics
        this.relayMetrics = relayMetrics
      } catch (error) {
        console.error('Could not fetch relay/metrics tx', error)
      }

      const timestamp = parseInt(tx.tags.find(tag => tag.name === 'Content-Timestamp')?.value || '')
      if (!Number.isNaN(timestamp)) {
        useState<number>('relayMetricsTimestamp').value = timestamp
        this.relayMetricsTimestamp = new Date(timestamp)
      }
    } else {
      console.error('Could not find relay/metrics tx')
    }
  }
}

const { arweave: { gateway } } = useAppConfig()
const runtimeConfig = useRuntimeConfig()
const metrics = new RelayMetrics(gateway, runtimeConfig.public.metricsDeployer)

export const useRelayMetrics = () => metrics
// {
//   metrics.refresh()

//   return metrics
// }
