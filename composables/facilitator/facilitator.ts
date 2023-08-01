import { Contract, JsonRpcSigner } from 'ethers'
import BigNumber from 'bignumber.js'

import { abi } from './Facility.json'

const ESTIMATED_ORACLE_GAS = BigNumber('42000')
const EVENTS = {
  ALLOCATION_UPDATED: 'AllocationUpdated'
}

export class Facilitator {
  constructor(
    private contract: Contract,
    private signer: JsonRpcSigner
  ) {}

  async getTokenAllocation(address: string): Promise<BigNumber> {
    const tokenAllocation = await this.contract.tokenAllocation(address)

    return BigNumber(tokenAllocation)
  }

  async getAlreadyClaimedTokens(address: string): Promise<BigNumber> {
    const alreadyClaimedTokens = await this.contract.tokenClaimed(address)

    return BigNumber(alreadyClaimedTokens)
  }

  async getGasAvailable(address: string): Promise<BigNumber> {
    const gasAvailable = await this.contract.gasAvailable(address)

    return BigNumber(gasAvailable)
  }

  async fundOracle(amount: BigNumber = ESTIMATED_ORACLE_GAS): Promise<void> {
    try {
      await this.contract.receive({ value: amount })
    } catch (error) {
      console.error('Error funding oracle', error)
    }
  }

  async requestUpdate(): Promise<void> {
    try {
      await this.contract.requestUpdate()

      this.contract.on(EVENTS.ALLOCATION_UPDATED, (address, amount, event) => {
        console.log(`${EVENTS.ALLOCATION_UPDATED} ${address} ${amount}`)

        // TODO -> update ui

        event.removeListener()
      })
    } catch (error) {
      console.error('Error requesting update from Facilitator', error )
    }
  }

  async claim(): Promise<void> {
    try {
      const address = this.signer.address
      const gasAvailable = await this.getGasAvailable(address)

      if (gasAvailable.lte(ESTIMATED_ORACLE_GAS)) {
        const amountToFund = ESTIMATED_ORACLE_GAS.minus(gasAvailable)
        await this.fundOracle(amountToFund)
      }

      await this.contract.claimAllocation()
    } catch (error) {
      console.error('Error claiming tokens', error)
    }
  }
}

export const useFacilitator = async () => {
  const config = useRuntimeConfig()
  const signer = await useSigner()
  if (!signer) { return null }

  try {
    const contract = new Contract(
      config.public.facilitatorContract,
      abi,
      signer
    )

    const address = await contract.getAddress()
    console.log('got facilitator contract', address)

    return new Facilitator(contract, signer)
  } catch (error) {
    console.error(
      'There was an error connecting to the Facilitator Contract',
      error
    )

    return null
  }
}
