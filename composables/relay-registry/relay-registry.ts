import {
  Contract,
  SigningFunction,
  WriteInteractionResponse
} from 'warp-contracts'

import { Claimable, EvmAddress, Fingerprint } from '~/utils/contracts'
import {
  Claim,
  RelayRegistryState,
  Renounce,
  Verified
} from './'

export class RelayRegistry {
  private _refreshing: boolean = false
  private sign: SigningFunction | null = null
  private contract: Contract<RelayRegistryState> | null = null
  private _isInitialized: boolean = false

  get isInitialized() { return this._isInitialized }

  initialize(
    contract: Contract<RelayRegistryState>,
    sign: SigningFunction
  ) {
    if (this._isInitialized) { return }

    this.contract = contract
    this.sign = sign
    this._isInitialized = true

    this.refresh()
  }

  private setRefreshing(refreshing: boolean) {
    useState<boolean>('relay-registry-refreshing').value = refreshing
    this._refreshing = refreshing
  }

  async refresh(): Promise<void> {
    if (this._refreshing) { return }
    
    this.setRefreshing(true)
    const auth = useAuth()
    // console.log('RelayRegistry refreshing for', auth.value?.address)
    console.time('relay-registry')

    let claimableRelays = null, verifiedRelays = null
    if (auth.value) {
      verifiedRelays = await this.verified(auth.value.address)
      claimableRelays = await this.claimable(auth.value.address)      
    }
    const totalVerifiedRelays = await this.verified()
    console.timeEnd('relay-registry')
    // console.log('RelayRegistry refreshed', {
    //   claimableRelays,
    //   verifiedRelays,
    //   totalVerifiedRelays
    // })
    this.setRefreshing(false)
  }

  async verified(address: EvmAddress): Promise<Fingerprint[]>
  async verified(): Promise<RelayRegistryState['verified']>
  async verified(address?: EvmAddress) {
    if (!this.contract) { return null }

    const { result } = await this.contract
      .viewState<Verified, RelayRegistryState['verified'] | Fingerprint[]>({
        function: 'verified',
        address
      })

    if (!!address && address === useAuth().value?.address) {
      useState<Fingerprint[]>('verifiedRelays').value = result as Fingerprint[]
    } else if (!address) {
      useState<RelayRegistryState['verified']>('totalVerifiedRelays').value =
        result as RelayRegistryState['verified']
    }

    return result
  }

  async claimable(address: string): Promise<Fingerprint[]>
  async claimable(): Promise<RelayRegistryState['claimable']>
  async claimable(address?: string) {
    if (!this.contract) { return null }

    const { result } = await this.contract
      .viewState<Claimable, RelayRegistryState['claimable'] | Fingerprint[]>({
        function: 'claimable',
        address
      })

    if (!!address && address === useAuth().value?.address) {
      useState<Fingerprint[]>('claimableRelays').value = result as Fingerprint[]
    }

    return result
  }

  async claim(fingerprint: string): Promise<WriteInteractionResponse | null> {
    if (!this.contract) { return null }
    if (!this.sign) { return null }

    return this.contract
      .connect({ signer: this.sign, type: 'ethereum' })
      .writeInteraction<Claim>({ function: 'claim', fingerprint })
  }

  async renounce(
    fingerprint: string
  ): Promise<WriteInteractionResponse | null> {
    if (!this.contract) { return null }
    if (!this.sign) { return null }

    return this.contract
      .connect({ signer: this.sign, type: 'ethereum' })
      .writeInteraction<Renounce>({ function: 'renounce', fingerprint })
  }
}

const relayRegistry = new RelayRegistry()
export const initRelayRegistry = async () => {
  if (relayRegistry.isInitialized) { return }

  const config = useRuntimeConfig()
  const warp = await useWarp()
  const contract = warp.contract<RelayRegistryState>(
    config.public.relayRegistryAddress
  )

  relayRegistry.initialize(contract, await createWarpSigningFunction())
}
export const useRelayRegistry = () => relayRegistry
