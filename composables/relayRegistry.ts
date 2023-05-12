import {
  Contract,
  EvolveState,
  SigningFunction,
  WriteInteractionResponse
} from 'warp-contracts'

// TODO -> get types from ATOR-development/smart-contracts
export type EvolvableState = Partial<EvolveState> & OwnableState
export type OwnableState = { owner?: string }
export type Fingerprint = string
export type EvmAddress = string
export type RelayRegistryState = OwnableState & EvolvableState & {
  claims: { [address in EvmAddress as string]: Fingerprint[] }
  verified: { [fingerprint: Fingerprint]: EvmAddress }
}
export type ContractFunctionInput = {
  function: string
  [key: string]: any
}
export interface Register extends ContractFunctionInput {
  function: 'register'
  fingerprint: Fingerprint
}
export interface Verify extends ContractFunctionInput {
  function: 'verify'
  fingerprint: Fingerprint
  address: EvmAddress
}
export interface Unregister extends ContractFunctionInput {
  function: 'unregister'
  fingerprint: Fingerprint
}
export interface RemoveStale extends ContractFunctionInput {
  function: 'remove-stale'
  fingerprint: Fingerprint
}

const formatTorFingerprint = (fingerprintHex: string) => {
  if (fingerprintHex === '0x0000000000000000000000000000000000000000') {
    return ''
  }

  return fingerprintHex.substring(2).toUpperCase()
}

export class RelayRegistry {
  constructor(
    private contract: Contract<RelayRegistryState>,
    private sign: SigningFunction
  ) {}

  async verified(address: string): Promise<string[]>
  async verified(): Promise<RelayRegistryState['verified']>
  async verified(address?: string) {
    const { cachedValue: { state } } = await this.contract.readState()

    if (address) {
      return Object
        .keys(state.verified)
        .map(fp => state.verified[fp])
        .filter(a => a === address)
    }

    return state.verified
  }

  async claims(address: string): Promise<string[]>
  async claims(): Promise<RelayRegistryState['claims']>
  async claims(address?: string) {
    const { cachedValue: { state } } = await this.contract.readState()

    if (address) {
      return state.claims[address] || []
    }
    
    return state.claims
  }

  async register(
    fingerprint: string
  ): Promise<WriteInteractionResponse | null> {
    return this.contract
      .connect({ signer: this.sign, type: 'ethereum' })
      .writeInteraction<Register>({ function: 'register', fingerprint })
  }

  async verify(claimedBy: string, fingerprint: string) {
    throw new Error('Not yet implemented')
  }
}

export const useRelayRegistry = async () => {
  const { contracts } = useAppConfig()
  const warp = await useWarp()
  const contract = warp.contract<RelayRegistryState>(contracts.relayRegistry)

  let sign: SigningFunction
  if (process.server) {
    sign = async (tx) => {}
  } else {
    const { evmSignature } = await import('warp-contracts-plugin-signature')
    sign = evmSignature
  }

  return new RelayRegistry(contract, sign)
}
