import { BrowserProvider, ethers } from 'ethers'
// import { BrowserProvider, getDefaultProvider } from 'ethers'

const NETWORKS = {
  MAINNET: { decimal: 1, hex: '0x1' },
  GOERLI: { decimal: 5, hex: '0x5' }
}

export const useSuggestMetaMask = () => useState<boolean | undefined>(
  'suggest-meta-mask',
  () => false
)

export const suggestMetaMask = useSuggestMetaMask()

// @ts-ignore
window.ethereum!.on('accountsChanged', (accounts: string[]) => {
  if (accounts.length > 0) {
    setAuth(accounts[0])
  } else {
    setAuth(undefined)
  }
})

export const useProvider = () => {
  if (process.server || typeof window === 'undefined') {
    return null
  } else if (!window.ethereum) {
    suggestMetaMask.value = true
    return null
  } else {
    const provider = new BrowserProvider(
      window.ethereum,
      NETWORKS.GOERLI.decimal
    )

    window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{
        chainId: NETWORKS.GOERLI.hex
      }]
    })

    return provider
  }
}
