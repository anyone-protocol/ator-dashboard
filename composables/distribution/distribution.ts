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
  constructor(
    private contract: Contract<DistributionState>,
    private sign: SigningFunction
  ) {}

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
      default:
        return wholeTokensPerSecond.times(24 * 60 * 60)
    }
  }

  async getPreviousDistributions(): Promise<PreviousDistribution[]> {
    const { cachedValue: { state } } = await this.contract.readState()

    return Object
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
  }

  async claimable(address: string, humanize = false) {
    const {
      result: claimable
    } = await this.contract.viewState<Claimable, string>({
      function: 'claimable',
      address
    })

    return humanize
      ? BigNumber(claimable).dividedBy(10e18).toFormat(4)
      : claimable
  }
}

export const useDistribution = async () => {
  const config = useRuntimeConfig()
  const warp = await useWarp()
  const contract = warp.contract<DistributionState>(
    config.public.distributionContract
  )

  return new Distribution(contract, await createWarpSigningFunction())
}
