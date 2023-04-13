import { BrowserProvider } from 'ethers'

export const useProvider = () => {
  if (process.server || typeof window === 'undefined' || !window.ethereum) {
    return null
  } else {
    const provider = new BrowserProvider(window.ethereum)

    // @ts-ignore
    window.ethereum.on('accountsChanged', accounts => {
      const auth = useAuth()

      if (accounts.length > 0) {
        auth.value = { address: accounts[0] }
      } else {
        auth.value = undefined
      }
    })

    return provider
  }
}