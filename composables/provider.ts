import { BrowserProvider, getDefaultProvider } from 'ethers'

const network = 31337 // TODO -> network swapping

export const useProvider = () => {

  if (process.server || typeof window === 'undefined') {
    return null
  } else if (!window.ethereum) {
    return getDefaultProvider(31337)
  } else {
    const provider = new BrowserProvider(window.ethereum, 31337)

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
