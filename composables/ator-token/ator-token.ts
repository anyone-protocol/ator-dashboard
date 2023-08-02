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
  private $eventBus = useNuxtApp().$eventBus
  private _refreshing: boolean = false

  constructor(
    private contract: Contract,
    private signer: JsonRpcSigner
  ) {}

  async refresh(): Promise<void> {
    if (this._refreshing) { return }

    this._refreshing = true
    const balance = await this.getBalance(this.signer.address)
    console.log('AtorToken refreshed', {
      balance: balance.toString()
    })
    this._refreshing = false
  }

  async getBalance(address: string): Promise<BigNumber> {
    const balance = await this.contract.balanceOf(address)

    if (address === this.signer.address) {     
      useState('tokenBalance').value = balance
      this.$eventBus.emit('TokenBalanceUpdated', {
        type: 'TokenBalanceUpdated',
        address,
        balance
      })
    }

    return BigNumber(balance)
  }
}

export const useAtorToken = async () => {
  const config = useRuntimeConfig()
  const auth = useAuth()
  const signer = auth.value && await useSigner()
  if (!signer) { return null }
  const provider = useProvider()
  if (!provider) { return null }

  try {
    const contract = new Contract(
      config.public.goerliAtorTokenContract,
      abi,
      provider
    )

    const atorToken = new AtorToken(contract, signer)
    
    await atorToken.refresh()

    return atorToken
  } catch (error) {
    console.error(ERRORS.CONNECTING_CONTRACT, error)

    return null
  }
}
