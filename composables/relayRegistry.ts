import { BaseContract, Contract, Typed } from 'ethers'

import RelayRegistryABI from 'ator-smart-contracts/artifacts/contracts/RelayRegistry.sol/RelayRegistry.json'
const registryContractAddress = '0x5FbDB2315678afecb367f032d93F642f64180aa3'

export const useRelayRegistry = () => {
  const provider = useProvider()
  if (!provider) {
    return null
  } else {
    return new Contract(registryContractAddress, RelayRegistryABI.abi)
  }
}
