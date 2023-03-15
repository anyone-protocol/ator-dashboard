import { BrowserProvider, Eip1193Provider } from 'ethers'

interface Auth {
  address: string
}

export const useAuth = () => useState<Auth | undefined>('auth', () => {
  // TODO -> check if ethereum wallet is already connected
  // with ethereum.request({ method: 'eth_requestAccounts' })

  return undefined
})
