import { BrowserProvider, ethers } from 'ethers'

interface Auth {
  address: string
}

export const setupAuth = async () => {
  const provider = useProvider()

  if (provider && provider instanceof BrowserProvider) {
    const accounts = await provider.listAccounts()

    if (accounts.length > 0) {
      setAuth(accounts[0].address)
    }
  }
}

export const useAuth = () => useState<Auth | undefined>('auth', () => undefined)
export const setAuth = (address?: string) => {
  const auth = useAuth()

  // TODO -> use actual authed address
  // address = address ? '0x0A393A0dFc3613eeD5Bd2A0A56d482351f4e3996' : undefined

  if (address) {
    auth.value = { address: ethers.getAddress(address) }
  } else {
    auth.value = undefined
  }
}
