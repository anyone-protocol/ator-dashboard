import { BrowserProvider } from 'ethers'

export const useProvider = () => {
  if (!window.ethereum) {
    return null
  } else {
    return new BrowserProvider(window.ethereum)
  }
}
