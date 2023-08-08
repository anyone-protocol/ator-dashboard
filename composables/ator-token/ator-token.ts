import { Contract, JsonRpcSigner } from 'ethers'
import BigNumber from 'bignumber.js'

import { abi } from './AirTor.json'

const ERRORS = {
  CONNECTING_CONTRACT:
    'There was an error connecting to the ATOR Token Contract'
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

    return BigNumber(balance.toString())
  }
}

const atorToken = new AtorToken()
export const initAtorToken = async () => {
  if (atorToken.isInitialized) { return }

  const provider = useProvider()
  if (!provider) { return }

  const config = useRuntimeConfig()
  const auth = useAuth()

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
