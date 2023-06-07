import {
  Contract,
  SigningFunction,
  WriteInteractionResponse
} from 'warp-contracts'

import {
  Claim,
  Claimable,
  EvmAddress,
  Fingerprint,
  RelayRegistryState,
  Renounce,
  Verified
} from './'

export class RelayRegistry {
  constructor(
    private contract: Contract<RelayRegistryState>,
    private sign: SigningFunction
  ) {}

  async verified(address: EvmAddress): Promise<Fingerprint[]>
  async verified(): Promise<RelayRegistryState['verified']>
  async verified(address?: EvmAddress) {
    const { result } = await this.contract
      .viewState<Verified, RelayRegistryState['verified'] | Fingerprint[]>({
        function: 'verified',
        address
      })

    return result
  }

  async claimable(address: string): Promise<Fingerprint[]>
  async claimable(): Promise<RelayRegistryState['claimable']>
  async claimable(address?: string) {
    const { result } = await this.contract
      .viewState<Claimable, RelayRegistryState['claimable'] | Fingerprint[]>({
        function: 'claimable',
        address
      })

    return result
  }

  async claim(fingerprint: string): Promise<WriteInteractionResponse | null> {
    return this.contract
      .connect({ signer: this.sign, type: 'ethereum' })
      .writeInteraction<Claim>({ function: 'claim', fingerprint })
  }

  async renounce(
    fingerprint: string
  ): Promise<WriteInteractionResponse | null> {
    return this.contract
    .connect({ signer: this.sign, type: 'ethereum' })
    .writeInteraction<Renounce>({ function: 'renounce', fingerprint })
  }
}

export const useRelayRegistry = async () => {
  const config = useRuntimeConfig()
  const warp = await useWarp()
  const contract = warp.contract<RelayRegistryState>(config.public.relayRegistryAddress)

  let sign: SigningFunction
  if (process.server) {
    sign = async (tx) => {}
  } else {
    const { evmSignature } = await import('warp-contracts-plugin-signature')
    sign = evmSignature
  }

  return new RelayRegistry(contract, sign)
}
