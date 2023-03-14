import { BrowserProvider, Eip1193Provider } from 'ethers'

export const useAuth = () => useState('auth', () => {
  // if (window.ethereum) {
  //   const provider = new BrowserProvider(window.ethereum)

    

  //   return true
  // } else {
    // todo: show message about installing metamask

    return false
  // }
})
