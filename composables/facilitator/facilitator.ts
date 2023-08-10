import { BrowserProvider, Contract, ContractTransactionResponse, ContractUnknownEventPayload, JsonRpcSigner, TransactionResponse, ethers } from 'ethers'
import BigNumber from 'bignumber.js'

import { abi } from './Facility.json'

const ESTIMATED_ORACLE_GAS = BigNumber('21644')
const GAS_PRICE_ETH = BigNumber('0.000000004')
const ORACLE_FEE_ETH = ESTIMATED_ORACLE_GAS.multipliedBy(GAS_PRICE_ETH)
export const FACILITATOR_EVENTS = {
  AllocationUpdated: 'AllocationUpdated',
  AllocationClaimed: 'AllocationClaimed',
  GasBudgetUpdated: 'GasBudgetUpdated',
  RequestingUpdate: 'RequestingUpdate'
}
export type FacilitatorEvent = keyof typeof FACILITATOR_EVENTS

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
  RECEIVE_AND_REQUEST_UPDATE:
    'Error funding & requesting update from Facilitator',
  NO_PROVIDER: 'No Provider to initialize Facilitator',
  NO_SIGNER: 'No Signer connected'
}

export class Facilitator {
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
      this.setSigner()
    }
    
    this._isInitialized = true

    this.refresh()
  }

  private initializeContract(signer?: JsonRpcSigner) {
    const provider = useProvider()
    if (!provider) { throw new Error('Ethereum Provider not available!') }

    this.contract = new Contract(
      config.public.facilitatorContract,
      abi,
      signer || provider
    )
    this.listenForUserEvents()
  }

  setSigner(signer?: JsonRpcSigner) {
    if (signer) {
      this.signer = signer
      this.initializeContract(signer)
    } else {
      this.signer = null
      this.initializeContract()
    }   
    
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

    let tokenAllocation = null,
      alreadyClaimed = null,
      gasAvailable = null,
      gasUsed = null,
      requestUpdateTx = null,
      allocationUpdatedTx = null,
      tokensClaimedTx = null

    if (auth.value) {
      tokenAllocation = await this.getTokenAllocation(auth.value.address)
      alreadyClaimed = await this.getAlreadyClaimedTokens(auth.value.address)
      gasAvailable = await this.getGasAvailable(auth.value.address)
      gasUsed = await this.getGasUsed(auth.value.address)
      const eventTxs = await this.queryEventTransactionsForUser()
      requestUpdateTx = eventTxs.requestUpdateTx
      allocationUpdatedTx = eventTxs.allocationUpdatedTx
      tokensClaimedTx = eventTxs.tokensClaimedTx
    }
    const oracleWeiRequired = await this.getOracleWeiRequired()

    console.timeEnd('facilitator')
    // console.log('Facilitator refreshed', {
    //   tokenAllocation: tokenAllocation?.toString(),
    //   alreadyClaimed: alreadyClaimed?.toString(),
    //   gasAvailable: gasAvailable?.toString(),
    //   gasUsed: gasUsed?.toString(),
    //   oracleWeiRequired: oracleWeiRequired.toString(),
    //   requestUpdateTx,
    //   allocationUpdatedTx,
    //   tokensClaimedTx
    // })
    this.setRefreshing(false)
  }

  async getTokenAllocation(address: string): Promise<BigNumber> {
    if (!this.contract) { throw new Error(ERRORS.NOT_INITIALIZED) }

    const tokenAllocation = await this.contract.allocatedTokens(address)

    if (address === useAuth().value?.address) {
      useState<string>('tokenAllocation').value = tokenAllocation.toString()
    }

    return BigNumber(tokenAllocation)
  }

  async getAlreadyClaimedTokens(address: string): Promise<BigNumber> {
    if (!this.contract) { throw new Error(ERRORS.NOT_INITIALIZED) }

    const alreadyClaimedTokens = await this.contract.claimedTokens(address)

    if (address === useAuth().value?.address) {
      useState<string>('alreadyClaimedTokens').value =
        alreadyClaimedTokens.toString()
    }

    return BigNumber(alreadyClaimedTokens)
  }

  async getGasAvailable(address: string): Promise<BigNumber> {
    if (!this.contract) { throw new Error(ERRORS.NOT_INITIALIZED) }

    const gasAvailable = await this.contract.availableBudget(address)

    if (address === useAuth().value?.address) {
      useState<string>('gasAvailable').value = gasAvailable.toString()
    }

    return BigNumber(gasAvailable)
  }

  async getGasUsed(address: string): Promise<BigNumber> {
    if (!this.contract) { throw new Error(ERRORS.NOT_INITIALIZED) }

    const gasUsed = await this.contract.usedBudget(address)

    if (address === useAuth().value?.address) {
      useState<string>('gasUsed').value = gasUsed.toString()
    }

    return BigNumber(gasUsed)
  }

  async getOracleWeiRequired(): Promise<BigNumber> {
    if (!this.contract) { throw new Error(ERRORS.NOT_INITIALIZED) }

    const GAS_COST: bigint = await this.contract.GAS_COST()
    const GAS_PRICE: bigint = await this.contract.GAS_PRICE()
    const oracleWeiRequired = GAS_COST * GAS_PRICE

    useState<string>('GAS_COST').value = GAS_COST.toString()
    useState<string>('GAS_PRICE').value = GAS_PRICE.toString()
    useState<string>('oracleWeiRequired').value = oracleWeiRequired.toString()

    return BigNumber(oracleWeiRequired.toString())
  }

  async query(
    facilitatorEvent: FacilitatorEvent,
    fromBlock?: ethers.BlockTag,
    toBlock?: ethers.BlockTag
  ): Promise<(ethers.EventLog | ethers.Log)[]> {
    if (!this.contract) { throw new Error(ERRORS.NOT_INITIALIZED) }

    try {
      const event = this.contract.filters[facilitatorEvent]
      const result = await this.contract.queryFilter(event, fromBlock, toBlock)

      console.log(`Facilitator query [${facilitatorEvent}]`, result)
      return result
    } catch (error) {
      console.error('Error querying facilitator contract events', error)
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

    // TODO -> query from height of last AllocationClaimed event
    const allocationClaimedEvents = await this.query('AllocationClaimed')
    // TODO -> what order are events in? first or last or no order? need to sort?
    const latestAllocationClaimedEvent: ethers.EventLog | ethers.Log | null = allocationClaimedEvents[0] || null
    const fromBlockHash = latestAllocationClaimedEvent ? latestAllocationClaimedEvent.blockHash : undefined
    
    const requestUpdateEvents = await this.query('RequestingUpdate', fromBlockHash)
    // TODO -> what order are events in? first or last or no order? need to sort?
    const latestRequestUpdateEvent: ethers.EventLog | ethers.Log | null = requestUpdateEvents[0] || null
    if (latestRequestUpdateEvent) {
      requestUpdateTx = latestRequestUpdateEvent.transactionHash
    }

    const allocationUpdatedEvents = await this.query('AllocationUpdated', fromBlockHash)
    // TODO -> what order are events in? first or last or no order? need to sort?
    const latestAllocationUpdatedEvent: ethers.EventLog | ethers.Log | null = allocationUpdatedEvents[0] || null
    if (latestAllocationUpdatedEvent) {
      allocationUpdatedTx = latestAllocationUpdatedEvent.transactionHash
    }

    const tokensClaimedEvents = await this.query('AllocationClaimed', fromBlockHash)
    // TODO -> what order are events in? first or last or no order? need to sort?
    const latestTokensClaimedEvents: ethers.EventLog | ethers.Log | null = tokensClaimedEvents[0] || null
    if (latestTokensClaimedEvents) {
      allocationUpdatedTx = latestTokensClaimedEvents.transactionHash
    }

    if (requestUpdateTx) {
      this.setRequestUpdateTx(requestUpdateTx)
      useState<boolean>('facilitator-request-update-tx-ready').value = true
    }
    if (allocationUpdatedTx) { this.setAllocationUpdatedTx(allocationUpdatedTx) }
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
    // console.log(
    //   'facilitator.fundOracle() oracleWeiRequired',
    //   oracleWeiRequired,
    //   ethers.formatEther(oracleWeiRequired)
    // )

    try {
      // const value = ethers.parseEther(amount.toString())
      const value = oracleWeiRequired
      const to = await this.contract.getAddress()
      // NB: receive() is a standard hook for when a normal tx sends value to
      //     a contract.  There is no explicit receive() interface on the ABI.
      //     So instead we send a normal transaction.
      const result = await this.signer.sendTransaction({ to, value })

      this.setRequestUpdateTx(result.hash)

      return result
    } catch (error) {
      console.error(ERRORS.FUNDING_ORACLE, error)
    }

    return null
  }

  async requestUpdate(): Promise<ContractTransactionResponse | null> {
    if (!this.contract) { throw new Error(ERRORS.NOT_INITIALIZED) }

    try {
      const result: ContractTransactionResponse =
        await this.contract.requestUpdate()
      
      this.setRequestUpdateTx(result.hash)

      return result
    } catch (error) {
      console.error(ERRORS.REQUESTING_UPDATE, error)
    }

    return null
  }

  async receiveAndRequestUpdate(): Promise<ContractTransactionResponse | null> {
    if (!this.contract) { throw new Error(ERRORS.NOT_INITIALIZED) }

    const oracleWeiRequired = useState<string>('oracleWeiRequired').value

    try {
      const result: ContractTransactionResponse = await this.contract
        .receiveAndRequestUpdate({ value: oracleWeiRequired })

      this.setRequestUpdateTx(result.hash)

      return result
    } catch (error) {
      console.error(ERRORS.RECEIVE_AND_REQUEST_UPDATE, error)
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
        this.setTokensClaimedTx(tx.hash)
        await tx.wait()
        await this.getAlreadyClaimedTokens(authedAddress)
      }
    } catch (error) {
      console.error('Error consuming AllocationClaimed event', error)
    }
  }

  private async onAllocationUpdated(
    address: string,
    amount: bigint,
    event: any
  ): Promise<void> {
    try {
      const auth = useAuth()
      if (!auth.value) { return }
      const authedAddress = auth.value.address

      if (authedAddress === address) {
        const tx = await event.getTransaction()
        this.setAllocationUpdatedTx(tx.hash)
        await tx.wait()
        await this.getTokenAllocation(authedAddress)
      }
    } catch (error) {
      console.error('Error consuming AllocationUpdated event', error)
    }
  }

  private async onGasBudgetUpdated(
    address: string,
    amount: bigint,
    event: any
  ): Promise<void> {}

  private async onRequestingUpdate(address: string, event: any): Promise<void> {
    try {
      const auth = useAuth()
      if (!auth.value) { return }
      const authedAddress = auth.value.address

      if (authedAddress === address) {
        const tx = await event.getTransaction()
        this.setRequestUpdateTx(tx.hash)
      }
    } catch (error) {
      console.error('Error consuming RequestingUpdate event', error)
    }
  }

  private listenForUserEvents() {
    if (!this.contract) { throw new Error(ERRORS.NOT_INITIALIZED) }

    this.contract.off(FACILITATOR_EVENTS.AllocationClaimed)
    this.contract.off(FACILITATOR_EVENTS.AllocationUpdated)
    this.contract.off(FACILITATOR_EVENTS.GasBudgetUpdated)
    this.contract.off(FACILITATOR_EVENTS.RequestingUpdate)
    
    const auth = useAuth()
    if (!auth.value) { return }

    this.contract.on(FACILITATOR_EVENTS.AllocationClaimed, this.onAllocationClaimed.bind(this))
    this.contract.on(FACILITATOR_EVENTS.AllocationUpdated, this.onAllocationUpdated.bind(this))
    this.contract.on(FACILITATOR_EVENTS.GasBudgetUpdated, this.onGasBudgetUpdated.bind(this))
    this.contract.on(FACILITATOR_EVENTS.RequestingUpdate, this.onRequestingUpdate.bind(this))
  }

  async claim(): Promise<boolean> {
    if (!this.contract) { throw new Error(ERRORS.NOT_INITIALIZED) }
    
    throw new Error('Facilitator.claim() is currently deprecated()')

    // try {
    //   const auth = useAuth()
    //   if (!auth.value) { return false }
    //   const address = auth.value.address
    //   const gasAvailable = await this.getGasAvailable(address)

    //   let isOracleFunded: boolean
    //   if (gasAvailable.lte(ESTIMATED_ORACLE_GAS)) {
    //     const amountToFund = ESTIMATED_ORACLE_GAS.minus(gasAvailable)
    //     isOracleFunded = await this.fundOracle(amountToFund)
    //   } else {
    //     isOracleFunded = true
    //   }

    //   if (!isOracleFunded) { throw new Error(ERRORS.COULD_NOT_FUND_ORACLE) }

    //   const success = await this.requestUpdate()

    //   if (!success) { throw new Error(ERRORS.REQUESTING_UPDATE) }

    //   if (success) {
    //     await this.contract.claimAllocation()

    //     return true
    //   }
    // } catch (error) {
    //   console.error(ERRORS.CLAIMING_TOKENS, error)
    // }

    // return false
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

    facilitator.initialize(signer)
  } catch (error) {
    console.error(ERRORS.CONNECTING_CONTRACT, error)
  }
}
export const useFacilitator = () => facilitator
