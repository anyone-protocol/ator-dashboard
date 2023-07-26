import { Contract, SigningFunction } from 'warp-contracts'

import { DistributionState } from './contract'
import { Claimable } from '~~/utils/contracts'

export type PreviousDistribution = {
  timestamp: string,
  date: Date,
  amount: string
}

export class Distribution {
  constructor(
    private contract: Contract<DistributionState>,
    private sign: SigningFunction
  ) {}

  async getDistributionRate() {
    const { cachedValue: { state } } = await this.contract.readState()

    return state.distributionAmount
  }

  async getPreviousDistributions(): Promise<PreviousDistribution[]> {
    const { cachedValue: { state } } = await this.contract.readState()

    return Object
      .keys(state.previousDistributions)
      .map<PreviousDistribution>(timestamp => {
        return {
          timestamp,
          date: new Date(Number.parseInt(timestamp)),
          amount: state.previousDistributions[timestamp].distributionAmount
        }
      })
      .reverse()
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
