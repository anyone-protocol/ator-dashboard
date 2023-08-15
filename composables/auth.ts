import { BrowserProvider, ethers } from 'ethers'
import { refreshDashboard } from '~/lib'

interface Auth {
  address: string
}

// export const initializeAuth = async () => {
//   const provider = initializeBrowserProvider()

//   if (provider && provider instanceof BrowserProvider) {
//     const accounts = await provider.listAccounts()

//     if (accounts.length > 0) {
//       setAuth(accounts[0].address)
//     }
//   }
// }

export const connectAuth = async () => {
  if (!window || !window.ethereum) {
    useSuggestMetaMask().value = true
  }

  const signer = await useSigner()

  if (signer) {
    setAuth(signer.address)
    const openWelcomeDialog = useWelcomeDialogOpen()
    const welcomeLastSeen = useWelcomeLastSeen()
    const { welcomeDialogUpdated } = useAppConfig()
    openWelcomeDialog.value = welcomeLastSeen.value
      ? welcomeLastSeen.value < welcomeDialogUpdated
      : true
  }
}

const onAccountsChanged = (accounts: string[]) => {
  if (accounts.length > 0) {
    setAuth(accounts[0])
  } else {
    setAuth(undefined)
  }
}

export const setAuth = (address?: string) => {
  const auth = useAuth()

  // TODO -> use actual authed address
  // address = address ? '0x0A393A0dFc3613eeD5Bd2A0A56d482351f4e3996' : undefined

  if (address) {
    auth.value = { address: ethers.getAddress(address) }
    // @ts-ignore
    window.ethereum!.on('accountsChanged', onAccountsChanged)
  } else {
    auth.value = undefined
    window.ethereum!.off('accountsChanged', onAccountsChanged)
  }

  refreshDashboard()
}

export const useAuth = () => useState<Auth | undefined>('auth', () => undefined)
