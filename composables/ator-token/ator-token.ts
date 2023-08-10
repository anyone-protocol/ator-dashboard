import { Contract, JsonRpcSigner } from 'ethers'
import BigNumber from 'bignumber.js'

import { abi } from './AirTor.json'
import { useFacilitator } from '../facilitator'
import { useDistribution } from '../distribution'

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

  get isInitialized() { return this._isInitialized }

  initialize(contract: Contract, signer?: JsonRpcSigner) {
    if (this._isInitialized) { return }

    this.contract = contract
    if (signer) { this.setSigner(signer) }
    this._isInitialized = true

    this.refresh()
  }

  setSigner(signer: JsonRpcSigner) {
    this.signer = signer
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
    // console.log('AtorToken refreshing for', auth.value?.address)
    console.time('ator-token')

    let balance = null
    if (auth.value) {
      balance = await this.getBalance(auth.value.address)
    }
    const facilitatorBalance = await this.getBalance(
      config.public.facilitatorContract
    )

    console.timeEnd('ator-token')
    // console.log('AtorToken refreshed', { balance })
    this.setRefreshing(false)
  }

  async getBalance(address: string): Promise<BigNumber> {
    if (!this.contract) { throw new Error('AtorToken not initialized!') }

    const balance = await this.contract.balanceOf(address)

    if (address === useAuth().value?.address) {
      useState<string>('tokenBalance').value = balance.toString()
    }

    if (address === config.public.facilitatorContract) {
      useState<string>('facilitatorTokenBalance').value = balance.toString()
    }

    return BigNumber(balance.toString())
  }

  private async onTransfer(from: string, to: string, value: bigint, event: any): Promise<void> {
    try {
      const auth = useAuth()
      if (!auth.value) { return }
      const authedAddress = auth.value.address

      // console.log('Token Contract [Transfer]')
      if (authedAddress === to && config.public.facilitatorContract === from) {
        // Refresh datas
        this.refresh()
        useFacilitator().refresh()
        useDistribution().refresh()
      }
    } catch (error) {
      console.error('Error consuming Transfer event', error)
    }
  }

  private listenForUserEvents() {
    if (!this.contract) { throw new Error(ERRORS.NOT_INITIALIZED) }
    const auth = useAuth()
    if (!auth.value) { return }

    this.contract.off(TOKEN_EVENTS.Transfer)
    this.contract.on(TOKEN_EVENTS.Transfer, this.onTransfer.bind(this))
  }
}

const config = useRuntimeConfig()
const auth = useAuth()
const provider = useProvider()
const atorToken = new AtorToken()
export const initAtorToken = async () => {
  if (atorToken.isInitialized) { return }
  if (!provider) { return }

  let signer: JsonRpcSigner | undefined
  if (auth.value) {
    const _signer = await useSigner()
    if (_signer) {
      signer = _signer
    }
  }

  try {
    const contract = new Contract(
      config.public.goerliAtorTokenContract,
      abi,
      provider
    )

    atorToken.initialize(contract, signer)
  } catch (error) {
    console.error(ERRORS.CONNECTING_CONTRACT, error)
  }
}
export const useAtorToken = () => atorToken
