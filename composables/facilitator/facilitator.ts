import {
  AbstractProvider,
  BrowserProvider,
  Contract,
  ContractUnknownEventPayload,
  JsonRpcSigner,
  TransactionResponse,
  ethers
} from 'ethers'
import BigNumber from 'bignumber.js'

import { abi } from './Facility.json'
import Logger from '~/utils/logger'
import { useFacilitatorStore } from '~/stores/facilitator'

export const FACILITATOR_EVENTS = {
  AllocationUpdated: 'AllocationUpdated',
  AllocationClaimed: 'AllocationClaimed',
  GasBudgetUpdated: 'GasBudgetUpdated',
  RequestingUpdate: 'RequestingUpdate'
}
export type FacilitatorEvent = keyof typeof FACILITATOR_EVENTS

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
  RECEIVE_AND_REQUEST_UPDATE:
    'Error funding & requesting update from Facilitator',
  NO_PROVIDER: 'No Provider to initialize Facilitator',
  NO_SIGNER: 'No Signer connected'
}

const logger = new Logger('Facilitator')

export class Facilitator {
  private _refreshing: boolean = false
  private contract!: Contract
  private signer: JsonRpcSigner | null = null
  private readonly logger = logger

  constructor(
    private contractAddress: string,
    provider: BrowserProvider | AbstractProvider
  ) {
    this.refreshContract(provider)
  }

  static buildContract(
    contractAddress: string,
    providerOrSigner: BrowserProvider | AbstractProvider | JsonRpcSigner
  ): Contract {
    return new Contract(contractAddress, abi, providerOrSigner)
  }

  private refreshContract(
    providerOrSigner: BrowserProvider | AbstractProvider | JsonRpcSigner
  ) {
    this.contract = Facilitator.buildContract(
      this.contractAddress,
      providerOrSigner
    )
    /* eslint-disable-next-line @typescript-eslint/no-floating-promises */
    this.listenForUserEvents()
  }

  async setSigner(signer?: JsonRpcSigner) {
    if (signer) {
      this.signer = signer
      this.refreshContract(this.signer)
    } else {
      this.signer = null
      this.refreshContract(useProvider())
    }   
    /* eslint-disable-next-line @typescript-eslint/no-floating-promises */
    return this.refresh()
  }

  private setRefreshing(refreshing: boolean) {
    useState<boolean>('facilitator-refreshing').value = refreshing
    this._refreshing = refreshing
  }

  async refresh(): Promise<void> {
    if (this._refreshing) { return }

    this.setRefreshing(true)
    const auth = useAuth()
    this.logger.info(
      auth.value?.address
        ? `Refreshing Facilitator for ${auth.value?.address}`
        : 'Refreshing Facilitator'
    )
    this.logger.time()

    let totalClaimed = null,
      gasAvailable = null,
      gasUsed = null

    if (auth.value) {
      totalClaimed = await this.getTotalClaimedTokens(auth.value.address)
      gasAvailable = await this.getGasAvailable(auth.value.address)
      gasUsed = await this.getGasUsed(auth.value.address)
    }
    const oracleWeiRequired = await this.getOracleWeiRequired()

    this.logger.timeEnd()
    this.logger.info('Facilitator refreshed', {
      totalClaimed: totalClaimed?.toString(),
      gasAvailable: gasAvailable?.toString(),
      gasUsed: gasUsed?.toString(),
      oracleWeiRequired: oracleWeiRequired.toString(),
    })
    this.setRefreshing(false)
  }

  async getTotalClaimedTokens(address: string): Promise<BigNumber> {
    if (!this.contract) { throw new Error(ERRORS.NOT_INITIALIZED) }

    const totalClaimedTokens = await this.contract
      .claimedTokens(address) as bigint

    if (address === useAuth().value?.address) {
      useFacilitatorStore().totalClaimedTokens = totalClaimedTokens.toString()
    }

    return BigNumber(totalClaimedTokens.toString())
  }

  async getGasAvailable(address: string): Promise<BigNumber> {
    if (!this.contract) { throw new Error(ERRORS.NOT_INITIALIZED) }

    const gasAvailable = await this.contract.availableBudget(address) as bigint

    return BigNumber(gasAvailable.toString())
  }

  async getGasUsed(address: string): Promise<BigNumber> {
    if (!this.contract) { throw new Error(ERRORS.NOT_INITIALIZED) }

    const gasUsed = await this.contract.usedBudget(address) as bigint

    return BigNumber(gasUsed.toString())
  }

  async getOracleWeiRequired(): Promise<BigNumber> {
    if (!this.contract) { throw new Error(ERRORS.NOT_INITIALIZED) }

    const GAS_COST = await this.contract.GAS_COST() as bigint
    const GAS_PRICE = await this.contract.GAS_PRICE() as bigint
    const oracleWeiRequired = GAS_COST * GAS_PRICE

    return BigNumber(oracleWeiRequired.toString())
  }

  async query(
    facilitatorEvent: FacilitatorEvent,
    address: string,
    fromBlock?: ethers.BlockTag,
    toBlock?: ethers.BlockTag
  ): Promise<(ethers.EventLog | ethers.Log)[]> {
    if (!this.contract) { throw new Error(ERRORS.NOT_INITIALIZED) }

    try {
      const filter = this.contract.filters[facilitatorEvent](address)

      return await this.contract.queryFilter(filter, fromBlock, toBlock)
    } catch (error) {
      this.logger.error('Error querying facilitator contract events', error)
    }

    return []
  }

  async claim(): Promise<TransactionResponse | null> {
    if (!this.signer) { throw new Error(ERRORS.NO_SIGNER) }
    if (!this.contract) { throw new Error(ERRORS.NOT_INITIALIZED) }

    const oracleWeiRequired = await this.getOracleWeiRequired()

    try {
      const value = oracleWeiRequired.toString()
      const to = await this.contract.getAddress()
      // NB: receive() is a standard hook for when a normal tx sends value to
      //     a contract.  There is no explicit receive() interface on the ABI.
      //     So instead we send a normal transaction.
      const result = await this.signer.sendTransaction({ to, value })
      await result.wait()
      const block = await result.getBlock()
      const timestamp = block?.timestamp || Math.floor(Date.now() / 1000)
      useFacilitatorStore().addPendingClaim(result.hash, timestamp)

      return result
    } catch (error) {
      this.logger.error(ERRORS.FUNDING_ORACLE, error)
    }

    return null
  }

  private async onAllocationClaimed(
    address: string,
    amount: bigint,
    event: ContractUnknownEventPayload
  ): Promise<void> {
    try {
      const auth = useAuth()
      if (!auth.value) { return }
      if (auth.value.address === address) {
        this.logger.info('onAllocationClaimed()', address, amount)
        const store = useFacilitatorStore()
        await store.onAllocationClaimed(amount, event)
        const tx = await event.getTransaction()
        await tx.wait()
        await this.getTotalClaimedTokens(auth.value.address)
      }
    } catch (error) {
      this.logger.error('Error consuming AllocationClaimed event', error)
    }
  }

  private async onAllocationUpdated(): Promise<void> {}
  private async onGasBudgetUpdated(): Promise<void> {}
  private async onRequestingUpdate(): Promise<void> {}

  private async listenForUserEvents() {
    if (!this.contract) { throw new Error(ERRORS.NOT_INITIALIZED) }

    await this.contract.off(FACILITATOR_EVENTS.AllocationClaimed)
    await this.contract.off(FACILITATOR_EVENTS.AllocationUpdated)
    await this.contract.off(FACILITATOR_EVENTS.GasBudgetUpdated)
    await this.contract.off(FACILITATOR_EVENTS.RequestingUpdate)
    
    const auth = useAuth()
    if (!auth.value) { return }

    
    await this.contract.on(
      FACILITATOR_EVENTS.AllocationClaimed,
      /* eslint-disable-next-line @typescript-eslint/no-misused-promises */
      this.onAllocationClaimed.bind(this)
    )
    await this.contract.on(
      FACILITATOR_EVENTS.AllocationUpdated,
      /* eslint-disable-next-line @typescript-eslint/no-misused-promises */
      this.onAllocationUpdated.bind(this)
    )
    await this.contract.on(
      FACILITATOR_EVENTS.GasBudgetUpdated,
      /* eslint-disable-next-line @typescript-eslint/no-misused-promises */
      this.onGasBudgetUpdated.bind(this)
    )
    await this.contract.on(
      FACILITATOR_EVENTS.RequestingUpdate,
      /* eslint-disable-next-line @typescript-eslint/no-misused-promises */
      this.onRequestingUpdate.bind(this)
    )
  }
}

let facilitator: Facilitator | null = null
export const initFacilitator = async () => {
  const config = useRuntimeConfig()
  const provider = useProvider()
  const auth = useAuth()

  if (!facilitator) {
    facilitator = new Facilitator(config.public.facilitatorContract, provider)
  }

  try {
    let signer: JsonRpcSigner | undefined
    if (auth.value) {
      const _signer = await useSigner()
      if (_signer) {
        signer = _signer
      }
    }

    await facilitator.setSigner(signer)
  } catch (error) {
    logger.error(ERRORS.CONNECTING_CONTRACT, error)
  }
}
export const useFacilitator = () => facilitator
