import { Contract, JsonRpcSigner } from 'ethers'
import BigNumber from 'bignumber.js'

import { abi } from './Facility.json'

const ESTIMATED_ORACLE_GAS = BigNumber('42000')
export const FACILITATOR_EVENTS = {
  ALLOCATION_UPDATED: 'AllocationUpdated'
}

export type AllocationUpdatedEvent = {
  type: 'AllocationUpdated',
  address: string,
  amount: string,
  evmEvent: any
}

const ERRORS = {
  CONNECTING_CONTRACT:
    'There was an error connecting to the Facilitator Contract',
  CLAIMING_TOKENS: 'Error claiming tokens',
  COULD_NOT_FUND_ORACLE: 'Could not fund Oracle',
  FUNDING_ORACLE: 'Error funding Oracle',
  REQUESTING_UPDATE: 'Error requesting update from Facilitator',
  REQUESTING_UPDATE_NOT_SUCCESSFUL:
    'Requesting update from Facilitator was not successful'
}

export class Facilitator {
  private $eventBus = useNuxtApp().$eventBus
  private _refreshing: boolean = false

  constructor(
    private contract: Contract,
    // private signer: JsonRpcSigner
  ) {
  }

  async refresh(): Promise<void> {
    if (this._refreshing) { return }

    this._refreshing = true
    const auth = useAuth()
    if (!auth.value) { return }
    const address = auth.value.address
    console.log('Refreshing Facilitator for address', address)
    const tokenAllocation = await this.getTokenAllocation(address)
    const alreadyClaimed = await this.getAlreadyClaimedTokens(address)
    const gasAvailable = await this.getGasAvailable(address)
    console.log('Facilitator refreshed', {
      tokenAllocation: tokenAllocation.toString(),
      alreadyClaimed: alreadyClaimed.toString(),
      gasAvailable: gasAvailable.toString()
    })
    this._refreshing = false
  }

  async getTokenAllocation(address: string): Promise<BigNumber> {
    const tokenAllocation = await this.contract.tokenAllocation(address)

    if (address === useAuth().value?.address) {
      useState<string>('tokenAllocation').value = tokenAllocation.toString()
    }

    return BigNumber(tokenAllocation)
  }

  async getAlreadyClaimedTokens(address: string): Promise<BigNumber> {
    const alreadyClaimedTokens = await this.contract.tokenClaimed(address)

    if (address === useAuth().value?.address) {
      useState<string>('alreadyClaimedTokens').value =
        alreadyClaimedTokens.toString()
    }

    return BigNumber(alreadyClaimedTokens)
  }

  async getGasAvailable(address: string): Promise<BigNumber> {
    const gasAvailable = await this.contract.gasAvailable(address)

    if (address === useAuth().value?.address) {
      useState<string>('gasAvailable').value = gasAvailable.toString()
    }

    return BigNumber(gasAvailable)
  }

  async fundOracle(amount: BigNumber = ESTIMATED_ORACLE_GAS): Promise<boolean> {
    try {
      await this.contract.receive({ value: amount })

      return true
    } catch (error) {
      console.error(ERRORS.FUNDING_ORACLE, error)
    }

    return false
  }

  async requestUpdate(): Promise<boolean> {
    try {
      await this.contract.requestUpdate()

      this.contract.on(
        FACILITATOR_EVENTS.ALLOCATION_UPDATED,
        (address, amount, event) => {
          if (address !== useAuth().value?.address) { return }
          console.log(
            `${FACILITATOR_EVENTS.ALLOCATION_UPDATED} ${address} ${amount}`
          )
          this.$eventBus.emit('AllocationUpdated', {
            type: 'AllocationUpdated',
            address,
            amount,
            evmEvent: event
          })
          event.removeListener()
        }
      )

      return true
    } catch (error) {
      console.error(ERRORS.REQUESTING_UPDATE, error )
    }

    return false
  }

  async claim(): Promise<boolean> {
    try {
      const auth = useAuth()
      if (!auth.value) { return false }
      const address = auth.value.address
      const gasAvailable = await this.getGasAvailable(address)

      let isOracleFunded: boolean
      if (gasAvailable.lte(ESTIMATED_ORACLE_GAS)) {
        const amountToFund = ESTIMATED_ORACLE_GAS.minus(gasAvailable)
        isOracleFunded = await this.fundOracle(amountToFund)
      } else {
        isOracleFunded = true
      }

      if (!isOracleFunded) { throw new Error(ERRORS.COULD_NOT_FUND_ORACLE) }

      const success = await this.requestUpdate()

      if (!success) { throw new Error(ERRORS.REQUESTING_UPDATE) }

      if (success) {
        await this.contract.claimAllocation()

        return true
      }
    } catch (error) {
      console.error(ERRORS.CLAIMING_TOKENS, error)
    }

    return false
  }
}

export const useFacilitator = async () => {
  const config = useRuntimeConfig()
  const provider = useProvider()
  const auth = useAuth()

  let signer: JsonRpcSigner | null = null
  if (auth.value) {
    signer = await useSigner()
  }
  try {
    const contract = new Contract(
      config.public.facilitatorContract,
      abi,
      signer || provider
    )

    const facilitator = new Facilitator(contract)

    await facilitator.refresh()

    return facilitator
  } catch (error) {
    console.error(ERRORS.CONNECTING_CONTRACT, error)

    return null
  }
}
