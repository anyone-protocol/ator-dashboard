import { EvolveState, SigningFunction } from 'warp-contracts'

export type ContractFunctionInput = {
  function: string
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  [key: string]: any
}
export type EvolvableState = Partial<EvolveState> & OwnableState
export type OwnableState = { owner?: string }
export type Fingerprint = string
export type EvmAddress = string

export interface Claimable extends ContractFunctionInput {
  function: 'claimable'
  address?: EvmAddress
}

export const formatTorFingerprint = (fingerprintHex: string) => {
  if (fingerprintHex === '0x0000000000000000000000000000000000000000') {
    return ''
  }

  return fingerprintHex.substring(2).toUpperCase()
}

export const createWarpSigningFunction = async (): Promise<SigningFunction> => {
  let sign: SigningFunction
  if (process.server) {
    sign = async () => {}
  } else {
    const { evmSignature } = await import('warp-contracts-plugin-signature')
    sign = evmSignature
  }

  return sign
}
