export const useSigner = async () => {
  const provider = useProvider()
  if (!provider) {
    return null
  } else {
    return await provider.getSigner()
  }
}
