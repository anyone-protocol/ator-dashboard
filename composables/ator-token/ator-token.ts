import { Contract, JsonRpcSigner } from 'ethers'
import BigNumber from 'bignumber.js'

import { abi } from './AirTor.json'
import { useFacilitator } from '../facilitator'
import { useDistribution } from '../distribution'
import Logger from '~/utils/logger'


const ERRORS = {
  CONNECTING_CONTRACT:
    'There was an error connecting to the ATOR Token Contract',
  NOT_INITIALIZED: 'Token Contract is not initialized!'
}

export const TOKEN_EVENTS = {
  Transfer: 'Transfer'
}

export type TokenBalanceUpdatedEvent = {
  type: 'TokenBalanceUpdated',
  address: string,
  balance: BigNumber
}

export class AtorToken {
  private _refreshing: boolean = false
  private contract: Contract | null = null
  private signer: JsonRpcSigner | null = null
  private _isInitialized: boolean = false
  private readonly logger = new Logger('AtorToken')

  get isInitialized() { return this._isInitialized }

  initialize(signer?: JsonRpcSigner) {
    if (this._isInitialized) { return }
    const provider = useProvider()
    if (!provider) { throw new Error('No Ethereum Provider available!') }

    if (signer) {
      this.setSigner(signer)
    } else {
      this.setSigner()
    }

    this._isInitialized = true
    /* eslint-disable-next-line @typescript-eslint/no-floating-promises */
    this.refresh()
  }

  private initializeContract(signer?: JsonRpcSigner) {
    const provider = useProvider()
    const config = useRuntimeConfig()
    if (!provider) { throw new Error('Ethereum Provider not available!') }

    this.contract = new Contract(
      config.public.goerliAtorTokenContract,
      abi,
      signer || provider
    )
    /* eslint-disable-next-line @typescript-eslint/no-floating-promises */
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
    /* eslint-disable-next-line @typescript-eslint/no-floating-promises */
    this.refresh()
  }

  private setRefreshing(refreshing: boolean) {
    useState<boolean>('ator-token-refreshing').value = refreshing
    this._refreshing = refreshing
  }

  async refresh(): Promise<void> {
    if (this._refreshing) { return }

    this.setRefreshing(true)
    const auth = useAuth()
    this.logger.info(
      auth.value?.address
        ? `AtorToken refreshing for ${auth.value?.address}`
        : 'AtorToken refreshing'
    )
    this.logger.time()

    let balance = null
    if (auth.value) {
      balance = await this.getBalance(auth.value.address)
    }
    this.logger.timeEnd()
    this.logger.info('AtorToken refreshed', { balance })
    this.setRefreshing(false)
  }

  async getBalance(address: string): Promise<BigNumber> {
    if (!this.contract) { throw new Error('AtorToken not initialized!') }

    const balance = await this.contract.balanceOf(address) as bigint

    if (address === useAuth().value?.address) {
      useState<string>('tokenBalance').value = balance.toString()
    }

    const config = useRuntimeConfig()
    if (address === config.public.facilitatorContract) {
      useState<string>('facilitatorTokenBalance').value = balance.toString()
    }

    return BigNumber(balance.toString())
  }

  private onTransfer(
    from: string,
    to: string,
    value: bigint
  ) {
    try {
      const auth = useAuth()
      if (!auth.value) { return }
      const authedAddress = auth.value.address

      const config = useRuntimeConfig()
      if (authedAddress === to && config.public.facilitatorContract === from) {
        useState<bigint>('token-contract-facilitator-transfer').value = value
        
        /* eslint-disable-next-line @typescript-eslint/no-floating-promises */
        this.refresh()
        const facilitator = useFacilitator()
        if (facilitator) {
          /* eslint-disable-next-line @typescript-eslint/no-floating-promises */
          facilitator.refresh()
        }
        /* eslint-disable-next-line @typescript-eslint/no-floating-promises */
        useDistribution().refresh()
      }
    } catch (error) {
      this.logger.error('Error consuming Transfer event', error)
    }
  }

  private async listenForUserEvents() {
    if (!this.contract) { throw new Error(ERRORS.NOT_INITIALIZED) }
    
    await this.contract.off(TOKEN_EVENTS.Transfer)
    
    const auth = useAuth()
    if (!auth.value) { return }
    
    await this.contract.on(TOKEN_EVENTS.Transfer, this.onTransfer.bind(this))
  }
}


const atorToken = new AtorToken()
export const initAtorToken = async () => {
  if (atorToken.isInitialized) { return }

  // const config = useRuntimeConfig()
  const auth = useAuth()
  // const provider = useProvider()

  try {
    let signer: JsonRpcSigner | undefined
    if (auth.value) {
      const _signer = await useSigner()
      if (_signer) {
        signer = _signer
      }
    }

    atorToken.initialize(signer)
  } catch (error) {
    console.error(ERRORS.CONNECTING_CONTRACT, error)
  }
}
export const useAtorToken = () => atorToken
