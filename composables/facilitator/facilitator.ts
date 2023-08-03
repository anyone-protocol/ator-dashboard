import { BrowserProvider, Contract, JsonRpcSigner, ethers } from 'ethers'
import BigNumber from 'bignumber.js'

import { abi } from './Facility.json'

const ESTIMATED_ORACLE_GAS = BigNumber('500000')
const GAS_PRICE_ETH = BigNumber('0.000000001')
const ORACLE_FEE_ETH = ESTIMATED_ORACLE_GAS.multipliedBy(GAS_PRICE_ETH)
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
  NOT_INITIALIZED: 'Facilitator is not initialized!',
  CONNECTING_CONTRACT:
    'There was an error connecting to the Facilitator Contract',
  CLAIMING_TOKENS: 'Error claiming tokens',
  COULD_NOT_FUND_ORACLE: 'Could not fund Oracle',
  FUNDING_ORACLE: 'Error funding Oracle',
  REQUESTING_UPDATE: 'Error requesting update from Facilitator',
  REQUESTING_UPDATE_NOT_SUCCESSFUL:
    'Requesting update from Facilitator was not successful',
  NO_PROVIDER: 'No Provider to initialize Facilitator',
  NO_SIGNER: 'No Signer connected'
}

export class Facilitator {
  private $eventBus = useNuxtApp().$eventBus
  private _refreshing: boolean = false
  private contract: Contract | null = null
  private signer: JsonRpcSigner | null = null
  private _isInitialized: boolean = false

  get isInitialized() { return this._isInitialized }

  initialize(signer?: JsonRpcSigner) {
    if (this._isInitialized) { return }
    if (!provider) { throw new Error(ERRORS.NO_PROVIDER) }

    if (signer) {
      this.setSigner(signer)
    } else {
      this.initializeContract(provider)
    }
    
    this._isInitialized = true

    this.refresh()
  }

  private initializeContract(signerOrProvider: JsonRpcSigner | BrowserProvider) {
    this.contract = new Contract(
      config.public.facilitatorContract,
      abi,
      signerOrProvider
    )
  }

  setSigner(signer: JsonRpcSigner) {
    console.log('Facilitator setSigner', signer.address)
    this.signer = signer
    this.initializeContract(signer)
    this.refresh()
  }

  private setRefreshing(refreshing: boolean) {
    useState<boolean>('facilitator-refreshing').value = refreshing
    this._refreshing = refreshing
  }

  async refresh(): Promise<void> {
    if (this._refreshing) { return }

    this.setRefreshing(true)
    const auth = useAuth()
    // console.log('Refreshing Facilitator for address', auth.value?.address)
    console.time('facilitator')

    let tokenAllocation = null, alreadyClaimed = null, gasAvailable = null

    if (auth.value) {
      tokenAllocation = await this.getTokenAllocation(auth.value.address)
      alreadyClaimed = await this.getAlreadyClaimedTokens(auth.value.address)
      gasAvailable = await this.getGasAvailable(auth.value.address)
    }
    console.timeEnd('facilitator')
    // console.log('Facilitator refreshed', {
    //   tokenAllocation: tokenAllocation?.toString(),
    //   alreadyClaimed: alreadyClaimed?.toString(),
    //   gasAvailable: gasAvailable?.toString()
    // })
    this.setRefreshing(false)
  }

  async getTokenAllocation(address: string): Promise<BigNumber> {
    if (!this.contract) { throw new Error(ERRORS.NOT_INITIALIZED) }

    const tokenAllocation = await this.contract.tokenAllocation(address)

    if (address === useAuth().value?.address) {
      useState<string>('tokenAllocation').value = tokenAllocation.toString()
    }

    return BigNumber(tokenAllocation)
  }

  async getAlreadyClaimedTokens(address: string): Promise<BigNumber> {
    if (!this.contract) { throw new Error(ERRORS.NOT_INITIALIZED) }

    const alreadyClaimedTokens = await this.contract.tokenClaimed(address)

    if (address === useAuth().value?.address) {
      useState<string>('alreadyClaimedTokens').value =
        alreadyClaimedTokens.toString()
    }

    return BigNumber(alreadyClaimedTokens)
  }

  async getGasAvailable(address: string): Promise<BigNumber> {
    if (!this.contract) { throw new Error(ERRORS.NOT_INITIALIZED) }

    const gasAvailable = await this.contract.gasAvailable(address)

    if (address === useAuth().value?.address) {
      useState<string>('gasAvailable').value = gasAvailable.toString()
    }

    return BigNumber(gasAvailable)
  }

  async fundOracle(amount: BigNumber = ORACLE_FEE_ETH): Promise<boolean> {
    if (!this.signer) { throw new Error(ERRORS.NO_SIGNER) }
    if (!this.contract) { throw new Error(ERRORS.NOT_INITIALIZED) }

    console.log('fundOracle', amount.toString(), 'eth')

    try {
      const value = ethers.parseEther(amount.toString())
      const to = await this.contract.getAddress()
      const tx = await this.signer.sendTransaction({ to, value })
      await tx.wait()
      // await this.contract.receive({ value })

      return true
    } catch (error) {
      console.error(ERRORS.FUNDING_ORACLE, error)
    }

    return false
  }

  async requestUpdate(): Promise<boolean> {
    if (!this.contract) { throw new Error(ERRORS.NOT_INITIALIZED) }

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
    if (!this.contract) { throw new Error(ERRORS.NOT_INITIALIZED) }

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

const config = useRuntimeConfig()
const auth = useAuth()
const provider = useProvider()
const facilitator = new Facilitator()
export const initFacilitator = async () => {
  if (facilitator.isInitialized) { return }

  try {
    let signer: JsonRpcSigner | undefined
    if (auth.value) {
      const _signer = await useSigner()
      if (_signer) {
        signer = _signer
      }
    }

    console.log('initFacilitator', signer?.address)

    facilitator.initialize(signer)
  } catch (error) {
    console.error(ERRORS.CONNECTING_CONTRACT, error)
  }
}
export const useFacilitator = () => facilitator
