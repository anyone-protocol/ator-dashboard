import {
  AbstractProvider,
  BrowserProvider,
  Contract,
  ContractTransactionResponse,
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

    let tokenAllocation = null,
      alreadyClaimed = null,
      gasAvailable = null,
      gasUsed = null

    if (auth.value) {
      tokenAllocation = await this.getTokenAllocation(auth.value.address)
      alreadyClaimed = await this.getAlreadyClaimedTokens(auth.value.address)
      gasAvailable = await this.getGasAvailable(auth.value.address)
      gasUsed = await this.getGasUsed(auth.value.address)
    }
    const oracleWeiRequired = await this.getOracleWeiRequired()

    this.logger.timeEnd()
    this.logger.info('Facilitator refreshed', {
      tokenAllocation: tokenAllocation?.toString(),
      alreadyClaimed: alreadyClaimed?.toString(),
      gasAvailable: gasAvailable?.toString(),
      gasUsed: gasUsed?.toString(),
      oracleWeiRequired: oracleWeiRequired.toString(),
    })
    this.setRefreshing(false)
  }

  async getTokenAllocation(address: string): Promise<BigNumber> {
    if (!this.contract) { throw new Error(ERRORS.NOT_INITIALIZED) }

    const tokenAllocation = await this.contract
      .allocatedTokens(address) as bigint

    if (address === useAuth().value?.address) {
      useState<string>('tokenAllocation').value = tokenAllocation.toString()
    }

    return BigNumber(tokenAllocation.toString())
  }

  async getAlreadyClaimedTokens(address: string): Promise<BigNumber> {
    if (!this.contract) { throw new Error(ERRORS.NOT_INITIALIZED) }

    const alreadyClaimedTokens = await this.contract
      .claimedTokens(address) as bigint

    if (address === useAuth().value?.address) {
      useState<string>('alreadyClaimedTokens').value =
        alreadyClaimedTokens.toString()
    }

    return BigNumber(alreadyClaimedTokens.toString())
  }

  async getGasAvailable(address: string): Promise<BigNumber> {
    if (!this.contract) { throw new Error(ERRORS.NOT_INITIALIZED) }

    const gasAvailable = await this.contract.availableBudget(address) as bigint

    if (address === useAuth().value?.address) {
      useState<string>('gasAvailable').value = gasAvailable.toString()
    }

    return BigNumber(gasAvailable.toString())
  }

  async getGasUsed(address: string): Promise<BigNumber> {
    if (!this.contract) { throw new Error(ERRORS.NOT_INITIALIZED) }

    const gasUsed = await this.contract.usedBudget(address) as bigint

    if (address === useAuth().value?.address) {
      useState<string>('gasUsed').value = gasUsed.toString()
    }

    return BigNumber(gasUsed.toString())
  }

  async getOracleWeiRequired(): Promise<BigNumber> {
    if (!this.contract) { throw new Error(ERRORS.NOT_INITIALIZED) }

    const GAS_COST = await this.contract.GAS_COST() as bigint
    const GAS_PRICE = await this.contract.GAS_PRICE() as bigint
    const oracleWeiRequired = GAS_COST * GAS_PRICE

    useState<string>('GAS_COST').value = GAS_COST.toString()
    useState<string>('GAS_PRICE').value = GAS_PRICE.toString()
    useState<string>('oracleWeiRequired').value = oracleWeiRequired.toString()

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
      const result = await this.contract.queryFilter(filter, fromBlock, toBlock)

      return result
    } catch (error) {
      this.logger.error('Error querying facilitator contract events', error)
    }

    return []
  }

  private async queryEventTransactionsForUser(): Promise<{
    requestUpdateTx: string | null,
    allocationUpdatedTx: string | null,
    tokensClaimedTx: string | null
  }> {
    let requestUpdateTx = null,
      allocationUpdatedTx = null,
      tokensClaimedTx = null

    const auth = useAuth()

    if (!auth.value) {
      return {
        requestUpdateTx: null,
        allocationUpdatedTx: null,
        tokensClaimedTx: null
      }
    }

    const allocationClaimedEvents = await this.query(
      'AllocationClaimed',
      auth.value.address
    )
    allocationClaimedEvents.reverse()
    const latestAllocationClaimedEvent: ethers.EventLog | ethers.Log | null =
      allocationClaimedEvents[0] || null
    const fromBlockNumber = latestAllocationClaimedEvent
      ? latestAllocationClaimedEvent.blockNumber
      : undefined
    const latestClaimedHash: string =
      latestAllocationClaimedEvent?.transactionHash || ''

    try {
      const requestUpdateEvents = await this.query(
        'RequestingUpdate',
        auth.value.address,
        fromBlockNumber
      )
      requestUpdateEvents.reverse()
      const latestRequestUpdate: ethers.EventLog | ethers.Log | null =
        requestUpdateEvents[0] || null
      if (
        latestRequestUpdate
        && latestRequestUpdate.transactionHash !== latestClaimedHash
      ) {
        requestUpdateTx = latestRequestUpdate.transactionHash
      }
    } catch (error) {
      this.logger.error('Error querying RequestingUpdate events', error)
    }

    try {
      const allocationUpdatedEvents = await this.query(
        'AllocationUpdated',
        auth.value.address,
        fromBlockNumber
      )
      allocationUpdatedEvents.reverse()
      const latestAllocationUpdated: ethers.EventLog | ethers.Log | null =
        allocationUpdatedEvents[0] || null
      if (
        latestAllocationUpdated
        && latestAllocationUpdated.transactionHash !== latestClaimedHash
      ) {
        allocationUpdatedTx = latestAllocationUpdated.transactionHash
      }
    } catch (error) {
      this.logger.error('Error querying AllocationUpdated events', error)
    }

    try {
      const tokensClaimedEvents = await this.query(
        'AllocationClaimed',
        auth.value.address,
        fromBlockNumber
      )
      tokensClaimedEvents.reverse()
      const latestTokensClaimedEvents: ethers.EventLog | ethers.Log | null =
        tokensClaimedEvents[0] || null
      if (
        latestTokensClaimedEvents
        && latestTokensClaimedEvents.transactionHash !== latestClaimedHash
      ) {
        tokensClaimedTx = latestTokensClaimedEvents.transactionHash
      }
    } catch (error) {
      this.logger.error('Error querying AllocationClaimed events', error)
    }

    if (requestUpdateTx) {
      this.setRequestUpdateTx(requestUpdateTx)
      useState<boolean>('facilitator-request-update-tx-ready').value = true
    }
    if (allocationUpdatedTx) {
      this.setAllocationUpdatedTx(allocationUpdatedTx)
    }
    if (tokensClaimedTx) { this.setTokensClaimedTx(tokensClaimedTx) }

    return {
      requestUpdateTx,
      allocationUpdatedTx,
      tokensClaimedTx
    }
  }

  async fundOracle(): Promise<TransactionResponse | null> {
    if (!this.signer) { throw new Error(ERRORS.NO_SIGNER) }
    if (!this.contract) { throw new Error(ERRORS.NOT_INITIALIZED) }

    const oracleWeiRequired = useState<string>('oracleWeiRequired').value

    try {
      const value = oracleWeiRequired
      const to = await this.contract.getAddress()
      // NB: receive() is a standard hook for when a normal tx sends value to
      //     a contract.  There is no explicit receive() interface on the ABI.
      //     So instead we send a normal transaction.
      const result = await this.signer.sendTransaction({ to, value })
      await result.wait()
      const block = await result.getBlock()
      if (!block) { throw new Error('Could not get block for funding tx') }
      useFacilitatorStore().addPendingClaim(result.hash, block.timestamp)

      return result
    } catch (error) {
      this.logger.error(ERRORS.FUNDING_ORACLE, error)
    }

    return null
  }

  async requestUpdate(): Promise<ContractTransactionResponse | null> {
    if (!this.contract) { throw new Error(ERRORS.NOT_INITIALIZED) }

    try {
      const result = await this.contract
        .requestUpdate() as ContractTransactionResponse
      
      this.setRequestUpdateTx(result.hash)

      return result
    } catch (error) {
      this.logger.error(ERRORS.REQUESTING_UPDATE, error)
    }

    return null
  }

  async receiveAndRequestUpdate(): Promise<ContractTransactionResponse | null> {
    if (!this.contract) { throw new Error(ERRORS.NOT_INITIALIZED) }

    const oracleWeiRequired = useState<string>('oracleWeiRequired').value

    try {
      const result = await this.contract
        .receiveAndRequestUpdate(
          { value: oracleWeiRequired }
        ) as ContractTransactionResponse

      this.setRequestUpdateTx(result.hash)

      return result
    } catch (error) {
      this.logger.error(ERRORS.RECEIVE_AND_REQUEST_UPDATE, error)
    }

    return null
  }

  private setRequestUpdateTx(txid: string | null) {
    useState<string | null>('facilitator-request-update-tx').value = txid
  }

  private setAllocationUpdatedTx(txid: string | null) {
    useState<string | null>('facilitator-allocation-updated-tx').value = txid
  }

  private setTokensClaimedTx(txid: string | null) {
    useState<string | null>('facilitator-tokens-claimed-tx').value = txid
  }

  private async onAllocationClaimed(
    address: string,
    amount: bigint,
    event: ContractUnknownEventPayload
  ): Promise<void> {
    try {
      const auth = useAuth()
      if (!auth.value) { return }
      const authedAddress = auth.value.address

      if (authedAddress === address) {
        const tx = await event.getTransaction()
        // this.setTokensClaimedTx(tx.hash)
        const store = useFacilitatorStore()
        await store.onAllocationClaimed(amount, event)
        await tx.wait()
        await this.getAlreadyClaimedTokens(authedAddress)
      }
    } catch (error) {
      this.logger.error('Error consuming AllocationClaimed event', error)
    }
  }

  private async onAllocationUpdated(
    address: string,
    amount: bigint,
    event: ContractUnknownEventPayload
  ): Promise<void> {
    try {
      const auth = useAuth()
      if (!auth.value) { return }
      const authedAddress = auth.value.address

      if (authedAddress === address) {
        const tx = await event.getTransaction()
        // this.setAllocationUpdatedTx(tx.hash)
        await tx.wait()
        await this.getTokenAllocation(authedAddress)
      }
    } catch (error) {
      this.logger.error('Error consuming AllocationUpdated event', error)
    }
  }

  private async onGasBudgetUpdated(): Promise<void> {}

  private async onRequestingUpdate(
    address: string,
    event: ContractUnknownEventPayload
  ): Promise<void> {
    try {
      const auth = useAuth()
      if (!auth.value) { return }
      const authedAddress = auth.value.address

      if (authedAddress === address) {
        // const store = useFacilitatorStore()
        // await store.onRequestingUpdate(event)
        const tx = await event.getTransaction()
        this.logger.log('onRequestingUpdate tx', tx.hash)
        // this.setRequestUpdateTx(tx.hash)
      }
    } catch (error) {
      this.logger.error('Error consuming RequestingUpdate event', error)
    }
  }

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
