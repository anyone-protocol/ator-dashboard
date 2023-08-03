import { Contract, SigningFunction } from 'warp-contracts'
import BigNumber from 'bignumber.js'
import moment from 'moment'

import { Claimable } from '~~/utils/contracts'
import { DistributionState } from './contract'

export type PreviousDistribution = {
  timestamp: string,
  date: Date,
  timeElapsed: string,
  tokensDistributedPerDay: string,
  totalScore: string,
  totalDistributed: string
}

export class Distribution {
  private _refreshing: boolean = false
  private contract: Contract<DistributionState> | null = null
  private sign: SigningFunction | null = null
  private _isInitialized: boolean = false

  get isInitialized() { return this._isInitialized }

  initialize(contract: Contract<DistributionState>, sign: SigningFunction) {
    if (this._isInitialized) { return }

    this.contract = contract
    this.sign = sign
    this._isInitialized = true

    this.refresh()
  }

  private setRefreshing(refreshing: boolean) {
    useState<boolean>('distribution-refreshing').value = refreshing
    this._refreshing = refreshing
  }

  async refresh(): Promise<void> {
    try {
      if (this._refreshing) { return }

      this.setRefreshing(true)
      const auth = useAuth()
      // console.log('Distribution refreshing for', auth.value?.address)
      console.time('distribution')

      let claimableAtomicTokens = null
      if (auth.value) {
        claimableAtomicTokens = await this.claimable(
          auth.value.address.toString()
        )
      }
      const previousDistributions = await this.getPreviousDistributions()
      const distributionRatePerDay = await this.getDistributionRatePer('day')
      console.timeEnd('distribution')
      // console.log('Distribution refreshed', {
      //   claimableAtomicTokens,
      //   previousDistributions,
      //   distributionRatePerDay: distributionRatePerDay.toString()
      // })
      this.setRefreshing(false)
    } catch (error) {
      console.error('ERROR REFRESHING DISTRIBUTION', error)
    }
  }

  async getDistributionRatePer(period: 'second' | 'hour' | 'day' = 'day') {
    if (!this.contract) {
      throw new Error('Distribution Contract not initialized!')
    }

    const { cachedValue: { state } } = await this.contract.readState()

    const wholeTokensPerSecond = BigNumber(state.tokensDistributedPerSecond)
      .dividedBy(10e18)

    switch (period) {
      case 'second':
        return wholeTokensPerSecond
      case 'hour':
        return wholeTokensPerSecond.times(24 * 60)
      case 'day':
        const rate = wholeTokensPerSecond.times(24 * 60 * 60)
        useState<string>('distributionRatePerDay').value = rate.toString()
        return rate
    }
  }

  async getPreviousDistributions(): Promise<PreviousDistribution[]> {
    if (!this.contract) {
      throw new Error('Distribution Contract not initialized!')
    }

    const { cachedValue: { state } } = await this.contract.readState()

    const previousDistributions = Object
      .keys(state.previousDistributions)
      .reverse()
      .map<PreviousDistribution>(timestamp => {
        const {
          totalScore,
          totalDistributed,
          timeElapsed,
          tokensDistributedPerSecond
        } = state.previousDistributions[timestamp]

        return {
          timestamp,
          date: new Date(Number.parseInt(timestamp)),
          totalScore: BigNumber(totalScore).toFormat(),
          timeElapsed: moment.duration(timeElapsed).humanize(),
          totalDistributed: BigNumber(totalDistributed)
            .dividedBy(10e18)
            .toFormat(2),
          tokensDistributedPerDay: BigNumber(tokensDistributedPerSecond)
            .dividedBy(10e18)
            .times(24 * 60 * 60)
            .toFormat(2)
        }
      })

    useState<PreviousDistribution[]>('previousDistributions').value =
      previousDistributions

    return previousDistributions
  }

  async claimable(address: string, humanize = false) {
    if (!this.contract) {
      throw new Error('Distribution Contract not initialized!')
    }

    try {
      const {
        result: claimable
      } = await this.contract.viewState<Claimable, string>({
        function: 'claimable',
        address
      })

      const auth = useAuth()
      if (auth.value && address === auth.value.address) {
        useState<string>('claimableAtomicTokens').value = claimable
      }

      return humanize
        ? BigNumber(claimable).dividedBy(10e18).toFormat(4)
        : claimable
    } catch (error) {
      console.error(
        'Error in Distribution when checking claimable tokens for',
        address,
        error
      )
    }
  }
}

const distribution = new Distribution()
export const initDistribution = async () => {
  if (distribution.isInitialized) { return }

  const config = useRuntimeConfig()
  const warp = await useWarp()
  const contract = warp.contract<DistributionState>(
    config.public.distributionContract
  )

  distribution.initialize(contract, await createWarpSigningFunction())
}
export const useDistribution = () => distribution
