import {
  Contract,
  JsonRpcSigner,
  TransactionResponse,
  Typed
} from 'ethers'

import RelayRegistryABI from 'ator-smart-contracts/artifacts/contracts/RelayRegistry.sol/RelayRegistry.json'
const registryAddress = '0x5FbDB2315678afecb367f032d93F642f64180aa3'

const formatTorFingerprint = (fingerprintHex: string) => {
  if (fingerprintHex === '0x0000000000000000000000000000000000000000') {
    return ''
  }

  return fingerprintHex.substring(2).toUpperCase()
}

export type Claim = {
  claimedBy: string
  fingerprint: string
}

export class RelayRegistry {
  constructor(private contract: Contract) {}

  connect(signer: JsonRpcSigner): RelayRegistryWithSigner {
    // @ts-ignore
    return new RelayRegistryWithSigner(this.contract.connect(signer))
  }

  async verified(): Promise<Claim[]> {
    const claims: Claim[] = await this.contract['function verified() view returns(tuple(address claimedBy, bytes20 fingerprint)[] memory)']()

    return claims.map(claim => {
      return {
        claimedBy: claim.claimedBy,
        fingerprint: formatTorFingerprint(claim.fingerprint)
      }
    })
  }

  async claims(address: string): Promise<Claim | null> {
    const fingerprint = formatTorFingerprint(
      await this.contract['function claims(address) view returns (bytes20)'](
        Typed.address(address)
      )
    )

    return fingerprint
      ? { claimedBy: address, fingerprint }
      : null
  }
}

class RelayRegistryWithSigner {
  constructor(private contract: Contract) {}

  async registerRelay(fingerprint: string): Promise<TransactionResponse> {
    return this.contract['function registerRelay(bytes20 fingerprint)'](
      Typed.bytes20('0x' + fingerprint)
    )
  }

  async verifyRelay(claimedBy: string, fingerprint: string) {
    return this.contract['function verifyClaim(address claimedBy, bytes20 fingerprint)'](
      Typed.address(claimedBy),
      Typed.bytes20('0x' + fingerprint)
    )
  }
}

export const useRelayRegistry = () => {
  const provider = useProvider()
  const contract = new Contract(registryAddress, RelayRegistryABI.abi, provider)
  
  return new RelayRegistry(contract)
}
