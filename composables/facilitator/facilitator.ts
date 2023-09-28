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
  private contract!: Contract
  private signer: JsonRpcSigner | null = null
  // private _isInitialized: boolean = false

  // get isInitialized() { return this._isInitialized }

  constructor(
    private contractAddress: string,
    private provider: BrowserProvider | AbstractProvider
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
    this.listenForUserEvents()
  }

  setSigner(signer?: JsonRpcSigner) {
    if (signer) {
      this.signer = signer
      this.refreshContract(this.signer)
    } else {
      this.signer = null
      this.refreshContract(useProvider())
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

    const auth = useAuth()

    if (!auth.value) { return { requestUpdateTx: null, allocationUpdatedTx: null, tokensClaimedTx: null } }

    const allocationClaimedEvents = await this.query('AllocationClaimed', auth.value.address)
    // console.log(`Facilitator checking for PREVIOUS claims found ${allocationClaimedEvents.length} AllocationClaimed event(s)`, allocationClaimedEvents)
    allocationClaimedEvents.reverse()
    const latestAllocationClaimedEvent: ethers.EventLog | ethers.Log | null = allocationClaimedEvents[0] || null
    const fromBlockNumber = latestAllocationClaimedEvent ? latestAllocationClaimedEvent.blockNumber : undefined
    const latestAllocationClaimedHash: string = latestAllocationClaimedEvent?.transactionHash || ''
    // console.log('Facilitator checking for PREVIOUS claims found latest AllocationClaimed event', latestAllocationClaimedEvent)
    // console.log('Faciltator checking for events from block', fromBlockNumber)

    try {
      const requestUpdateEvents = await this.query('RequestingUpdate', auth.value.address, fromBlockNumber)
      requestUpdateEvents.reverse()
      const latestRequestUpdateEvent: ethers.EventLog | ethers.Log | null = requestUpdateEvents[0] || null
      if (latestRequestUpdateEvent && latestRequestUpdateEvent.transactionHash !== latestAllocationClaimedHash) {
        requestUpdateTx = latestRequestUpdateEvent.transactionHash
      }
    } catch (error) {
      console.error('Error querying RequestingUpdate events', error)
    }

    try {
      const allocationUpdatedEvents = await this.query('AllocationUpdated', auth.value.address, fromBlockNumber)
      allocationUpdatedEvents.reverse()
      const latestAllocationUpdatedEvent: ethers.EventLog | ethers.Log | null = allocationUpdatedEvents[0] || null
      if (latestAllocationUpdatedEvent && latestAllocationUpdatedEvent.transactionHash !== latestAllocationClaimedHash) {
        allocationUpdatedTx = latestAllocationUpdatedEvent.transactionHash
      }
    } catch (error) {
      console.error('Error querying AllocationUpdated events', error)
    }

    try {
      const tokensClaimedEvents = await this.query('AllocationClaimed', auth.value.address, fromBlockNumber)
      tokensClaimedEvents.reverse()
      const latestTokensClaimedEvents: ethers.EventLog | ethers.Log | null = tokensClaimedEvents[0] || null
      if (latestTokensClaimedEvents && latestTokensClaimedEvents.transactionHash !== latestAllocationClaimedHash) {
        tokensClaimedTx = latestTokensClaimedEvents.transactionHash
      }
    } catch (error) {
      console.error('Error querying AllocationClaimed events', error)
    }

    if (requestUpdateTx) {
      this.setRequestUpdateTx(requestUpdateTx)
      useState<boolean>('facilitator-request-update-tx-ready').value = true
    }
    if (allocationUpdatedTx) {
      this.setAllocationUpdatedTx(allocationUpdatedTx)
    }
    if (tokensClaimedTx) { this.setTokensClaimedTx(tokensClaimedTx) }

    // console.log('Facilitator found RequestingUpdate Event TX', requestUpdateTx)
    // console.log('Facilitator found AllocationUpdated Event TX', allocationUpdatedTx)
    // console.log('Facilitator found AllocationClaimed Event TX', tokensClaimedTx)

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

    facilitator.setSigner(signer)
  } catch (error) {
    console.error(ERRORS.CONNECTING_CONTRACT, error)
  }
}
export const useFacilitator = () => facilitator
