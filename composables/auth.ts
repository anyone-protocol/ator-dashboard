import { BrowserProvider } from 'ethers'

interface Auth {
  address: string
}

export const setupAuth = async () => {
  const auth = useAuth()
  const provider = useProvider()

  if (provider && provider instanceof BrowserProvider) {
    const accounts = await provider.listAccounts()

    if (accounts.length > 0) {
      auth.value = { address: accounts[0].address }
    }
  }

  return auth
}

export const useAuth = () => useState<Auth | undefined>('auth', () => undefined)
