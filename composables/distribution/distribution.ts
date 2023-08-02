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

  constructor(
    private contract: Contract<DistributionState>,
    private sign: SigningFunction
  ) {}

  async refresh(): Promise<void> {
    console.log('distribution.refresh()')
    try {
      if (this._refreshing) { return }

      this._refreshing = true
      let claimableAtomicTokens = null
      const auth = useAuth()
      console.log('auth.value in refresh()', auth.value)
      if (auth.value) {
        console.log('Refreshing claimable tokens for', auth.value.address)
        claimableAtomicTokens = await this.claimable(auth.value.address.toString())
      }
      const previousDistributions = await this.getPreviousDistributions()
      const distributionRatePerDay = await this.getDistributionRatePer('day')
      console.log('Distribution refreshed', {
        claimableAtomicTokens,
        previousDistributions,
        distributionRatePerDay: distributionRatePerDay.toString()
      })
      this._refreshing = false
    } catch (error) {
      console.error('ERROR REFRESHING DISTRIBUTION')
    }
  }

  async getDistributionRatePer(period: 'second' | 'hour' | 'day' = 'day') {
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
    console.log('claimable()', address, typeof address)
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

export const useDistribution = async () => {
  const config = useRuntimeConfig()
  const warp = await useWarp()
  const contract = warp.contract<DistributionState>(
    config.public.distributionContract
  )

  const distribution = new Distribution(
    contract,
    await createWarpSigningFunction()
  )

  await distribution.refresh()

  return distribution
}
