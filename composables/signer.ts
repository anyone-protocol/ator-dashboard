import { AbstractProvider, BrowserProvider } from 'ethers'

export const useSigner = async () => {
  let provider = useProvider()

  if (provider instanceof AbstractProvider) {
    console.log('provider is AbtractProvider')
    provider = initializeBrowserProvider()
  }

  if (provider instanceof BrowserProvider) {
    console.log('provider is BrowserProvider')
    try {
      const signer = await (provider as BrowserProvider).getSigner()
      console.log('provider._network.name',provider._network.name)
      if (provider._network.name !== NETWORKS.GOERLI.name) {
        await window.ethereum!.request({
          method: 'wallet_switchEthereumChain',
          params: [{
            chainId: NETWORKS.GOERLI.hex
          }]
        })
      }

      return signer
    } catch (error) {
      console.error('Error getting Signer', error)
    }
  }

  console.log('return null')

  return null
}
