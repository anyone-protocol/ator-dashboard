import { Contract, SigningFunction } from 'warp-contracts'
import BigNumber from 'bignumber.js'

import { Claimable } from '~~/utils/contracts'
import { DistributionState } from './contract'

export type PreviousDistribution = {
  timestamp: string,
  date: Date,
  timeElapsed: string,
  tokensDistributedPerSecond: string,
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
        const totalDistributed = state
          .previousDistributions[timestamp]
          .totalDistributed

        return {
          timestamp,
          date: new Date(Number.parseInt(timestamp)),
          ...state.previousDistributions[timestamp],
          totalDistributed: BigNumber(totalDistributed)
            .dividedBy(10e18)
            .toString()
        }
      })
  }

  async claimable(address: string) {
    const { cachedValue: { state } } = await this.contract.readState()
    console.log('DISTRIBUTION STATE', state)

    const { result } = await this.contract.viewState<Claimable, any>({
      function: 'claimable',
      address
    })

    return result
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
