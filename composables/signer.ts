import { BrowserProvider } from 'ethers'

export const useSigner = async () => {
  const provider = useProvider()
  if (!provider || !(provider instanceof BrowserProvider)) {
    return null
  } else {
    return await provider.getSigner()
  }
}
